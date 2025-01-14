const db = require("../db");
const moment = require("moment");

const create_event = async (req, res) => {
  try {
    const {
      name,
      description,
      capacity,
      venue,
      event_date,
      start_time,
      end_time,
      category,
      image_url,
      tags,
    } = req.body.formData;
    const status = "Scheduled"; // Scheduled, Cancelled, Featured, Completed, Postponed

    const q =
      "INSERT INTO events (name, description, capacity, venue, organized_by, event_date, start_time, end_time, category, status, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";

    db.execute(
      q,
      [
        name,
        description,
        capacity,
        venue,
        req.user.id,
        event_date,
        start_time,
        end_time,
        category,
        status,
        image_url,
      ],
      (err, results) => {
        if (err) throw err;

        console.log("RESULT INSERT ID: ", results.insertId);

        // insert tags
        tags.forEach((tag_name) => {
          let q2 = `insert ignore into event_tags(event_id, tag_name) values(?, ?);`;
          db.execute(q2, [results.insertId, tag_name], (err, results) => {
            if (err) {
              console.log(err);
            }
          });
        });

        return res
          .status(201)
          .json({ success: true, event_id: results.insertId });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const get_admin_counts = (req, res) => {
  // count of users, categories, reviews, etc
  db.query(
    `
    select count(*) as users from users;
    select count(*) as categories from categories;
    select count(*) as registrations from registrations;
    select count(*) as tags from tags;
    select count(*) as events from events;
    select count(*) as tickets from tickets;
    select count(*) as reviews from reviews;
    `,
    (err, results) => {
      if (err) throw err;

      res.status(200).json(results.map((res) => res[0]));
    }
  );
};

const get_events = async (req, res) => {
  const { q, tags, category, type } = req.query;
  str = "SELECT * FROM events where status <> 'Cancelled' and verified = 1";
  if (q) str += ` and name like '%${q}%'`; // cmnt: avoid sql injection
  if (tags != "all")
    str += ` and event_id in (select event_id from event_tags where tag_name in (${tags
      .split(",")
      .map((tag) => `'${tag}'`)}))`;
  if (category != "all") str += ` and category = '${category}'`;
  if (type != "all") {
    if (type == "Scheduled") {
      str += ` and status = 'Scheduled'`;
    } else if (type == "Completed") {
      str += ` and status = 'Completed'`;
    }
  }
  str += " order by created_at desc";

  // console.log(str);

  try {
    db.query(str, (err, results) => {
      if (err) throw err;
      res.status(200).json({ success: true, events: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const get_organized_by = async (req, res) => {
  try {
    const q = "SELECT * FROM events where organized_by = ?;";
    db.query(q, [req.params.id], (err, results) => {
      if (err) throw err;
      res.status(200).json({ success: true, events: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const get_all_events = (req, res) => {
  const q = "SELECT * FROM get_all_events_view";
  db.query(q, (err, results) => {
    if (err) throw err;
    res.status(200).json(results);
  });
};

const get_attended_by_me = async (req, res) => {
  try {
    const q =
      "SELECT * FROM events where event_id in (select event_id from attendance where user_id = ?) and verified = 1;";
    db.query(q, [req.user.id], (err, results) => {
      if (err) throw err;
      res.status(200).json({ success: true, events: results });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const get_event = async (req, res) => {
  try {
    const { id } = req.params;
    // show: procedure
    const q = "CALL GetEventView(?);";
    db.query(q, [id], (err, result) => {
      // console.log(id, result[0]);

      if (err) throw err;
      if (result.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "Event not found" });

      db.query(
        "select * from event_tags where event_id = ?",
        [id],
        (err2, result2) => {
          // console.log(result2);

          if (err2) {
            res.status(500).json({ success: false, error: err2.message });
            throw err2;
          }

          let result_final = [];
          if (result.length && result[0] && result[0].length) {
            result_final = result[0][0];
          }

          return res
            .status(200)
            .json({ success: true, event: { ...result_final, tags: result2 } });
        }
      );
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const get_can_review = (req, res) => {
  const { id } = req.params;
  const q = `select * from attendance where event_id = ? and user_id = ?;`;

  db.query(q, [id, req.user.id], (error, results) => {
    if (error) {
      res.status(500).json({ error: error });
      throw error;
    }

    if (results.length === 0) {
      return res.json({ attended: false, reviewed: false });
    } else {
      db.query(
        "select * from reviews where event_id = ? and user_id = ?;",
        [id, req.user.id],
        (error2, results2) => {
          if (error2) {
            res.status(500).json({ error: error2 });
            throw error2;
          }

          if (results2.length === 0) {
            return res.json({ attended: true, reviewed: false });
          } else {
            return res.json({ attended: true, reviewed: true });
          }
        }
      );
    }
  });
};

const get_analytics = (req, res) => {
  const { id } = req.params;

  // name
  const q1 = "select name from events where event_id = ? and verified = 1;";
  db.query(q1, [id], (error1, results1) => {
    if (error1) {
      res.status(500).json({ error: error1 });
      throw error1;
    }
    // show: procedure
    const q2 = `CALL GetAnalyticsView(?);`;

    db.query(q2, [id], (error2, results2) => {
      if (error2) {
        res.status(500).json({ error: error2 });
        throw error2;
      }

      if (results1.length === 0 || results2.length === 0 || !results1[0].name) {
        return res.status(500).json({ error: "Error" });
      }

      res.json({ name: results1[0].name, results: results2[0] });
    });
  });
};

const mark_present = (req, res) => {
  const { user_id, id } = req.params;
  const q = `insert ignore into attendance(user_id, event_id) values(?, ?);`;
  db.query(q, [user_id, id], (error, results) => {
    if (error) {
      res.status(500).json(error);
      throw error;
    }

    res.json(results);
  });
};

const mark_absent = (req, res) => {
  const { user_id, id } = req.params;
  const q = `delete from attendance where user_id = ? and event_id = ?`;
  db.query(q, [user_id, id], (error, results) => {
    if (error) {
      res.status(500).json(error);
      throw error;
    }

    res.json(results);
  });
};

const get_ticket_types = (req, res) => {
  const { id } = req.params;
  const q = `select * from tickets where event_id = ?;`;
  db.query(q, [id], (error, results) => {
    if (error) {
      res.status(500).json(error);
      throw error;
    }

    res.json(results);
  });
};

const get_featured = async (req, res) => {
  try {
    const q = "select * from get_featured_view;";
    db.query(q, (err, result) => {
      if (err) throw err;
      if (result.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "Event not found" });

      res.status(200).json({ success: true, events: result });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const get_upcoming = async (req, res) => {
  try {
    const q = "select * from get_upcoming_view;";
    db.query(q, (err, result) => {
      if (err) throw err;
      if (result.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "Event not found" });
      res.status(200).json({ success: true, events: result });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const get_categories = (req, res) => {
  db.query("select name from categories", (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    res.json(results);
  });
};

const get_tags = (req, res) => {
  db.query("select name from tags", (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    res.json(results);
  });
};

const get_event_tags = (req, res) => {
  db.query(
    "select tag_name from event_tags where event_id = ?",
    [req.params.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Server error" });
      }

      // console.log("312: ", results);
      res.json(results);
    }
  );
};

const update_event = async (req, res) => {
  try {
    let { id } = req.params;

    let {
      name,
      description,
      capacity,
      venue,
      event_date,
      start_time,
      end_time,
      category,
      image_url,
      tags,
      verified,
    } = req.body;

    // console.log("before: ", event_date, start_time, end_time);
    // console.log("===============");

    // event_date = moment(event_date).format("YYYY-MM-DD HH:mm:ss");
    // start_time = moment(event_date).format("HH:mm:ss");
    // end_time = moment(event_date).format("HH:mm:ss");

    // console.log("after: ", event_date, start_time, end_time);

    // console.log(start_time, end_time);

    event_date = new Date(event_date)
      .toISOString()
      .slice(0, 19)
      .replace("T", " "); // to convert from iso format to mysql format

    console.log("after: ", event_date, start_time, end_time);

    let q =
      "UPDATE events SET name = ?, description = ?, capacity = ?, venue = ?, event_date = ?, start_time = ?, end_time = ?, category = ?, image_url = ?, verified = ? WHERE event_id = ?;";

    db.execute(
      q,
      [
        name,
        description,
        capacity,
        venue,
        event_date,
        start_time,
        end_time,
        category,
        image_url,
        verified,
        id,
      ],
      (err, results) => {
        if (err) {
          console.log(err);

          throw err;
        }
        if (results.affectedRows === 0)
          return res
            .status(404)
            .json({ success: false, message: "Event not found" });

        if (!req.body.req_from_admin) {
          // delete tags of that event
          let q1 = `delete from event_tags where event_id = ?;`;
          db.execute(q1, [id], (err, results) => {
            if (err) throw err;

            // insert tags
            if (tags && tags.length > 0) {
              tags.forEach((tag_name) => {
                let q2 = `insert ignore into event_tags(event_id, tag_name) values(?, ?);`; // cmnt: batch insertion
                db.execute(q2, [id, tag_name], (err, results) => {
                  if (err) {
                    console.log(err);
                  }
                });
              });
            }
          });
        }

        return res
          .status(200)
          .json({ success: true, message: "Event updated successfully" });
      }
    );
  } catch (error) {
    console.log(error);

    return res.status(500).json({ success: false, error: error.message });
  }
};

const delete_event = async (req, res) => {
  try {
    const { id } = req.params;
    const q = "DELETE FROM events WHERE event_id = ?;";
    db.execute(q, [id], (err, results) => {
      if (err) throw err;
      if (results.affectedRows === 0)
        return res
          .status(404)
          .json({ success: false, message: "Event not found" });
      res
        .status(200)
        .json({ success: true, message: "Event deleted successfully" });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const cancel_event = (req, res) => {
  const { id } = req.params;

  // cancel only if no registration is confirmed
  const q1 =
    "SELECT * FROM registrations WHERE event_id = ? AND status = 'Confirmed';";
  db.execute(q1, [id], (err, results) => {
    if (err) throw err;
    if (results.length > 0)
      return res.status(400).json({
        success: false,
        message:
          "Users have already paid for this event. Approach admin for cancellation of this event.",
      });

    const q = "UPDATE events SET status = 'Cancelled' WHERE event_id = ?;";
    db.execute(q, [id], (err, results) => {
      if (err) throw err;
      if (results.affectedRows === 0)
        return res
          .status(404)
          .json({ success: false, message: "Event not found" });
      res
        .status(200)
        .json({ success: true, message: "Event cancelled successfully" });
    });
  });
};

const create_category = (req, res) => {
  const { name } = req.body;
  const q = "INSERT INTO categories(name) VALUES(?);";
  db.execute(q, [name], (err, results) => {
    if (err) throw err;
    res
      .status(200)
      .json({ success: true, message: "Category created successfully" });
  });
};

const delete_category = (req, res) => {
  const { name } = req.body;
  // console.log(req.body);

  const q = "DELETE FROM categories WHERE name = ?;";
  db.execute(q, [name], (err, results) => {
    if (err) throw err;
    if (results.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    res
      .status(200)
      .json({ success: true, message: "Category deleted successfully" });
  });
};

const update_category = (req, res) => {
  const { name, oldName } = req.body;

  const q = "UPDATE categories SET name = ? WHERE name = ?;";
  db.execute(q, [name, oldName], (err, results) => {
    if (err) throw err;
    if (results.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });

    res
      .status(200)
      .json({ success: true, message: "Category updated successfully" });
  });
};

const create_tag = (req, res) => {
  const { name } = req.body;
  const q = "INSERT INTO tags(name) VALUES(?);";
  db.execute(q, [name], (err, results) => {
    if (err) throw err;
    res
      .status(200)
      .json({ success: true, message: "Tag created successfully" });
  });
};

const delete_tag = (req, res) => {
  const { name } = req.body;
  // console.log(req.body);

  const q = "DELETE FROM tags WHERE name = ?;";
  db.execute(q, [name], (err, results) => {
    if (err) throw err;
    if (results.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Tag not found" });
    res
      .status(200)
      .json({ success: true, message: "Tag deleted successfully" });
  });
};

const update_tag = (req, res) => {
  const { name, oldName } = req.body;

  const q = "UPDATE tags SET name = ? WHERE name = ?;";
  db.execute(q, [name, oldName], (err, results) => {
    if (err) throw err;
    if (results.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Tag not found" });

    res
      .status(200)
      .json({ success: true, message: "Tag updated successfully" });
  });
};

module.exports = {
  create_event,
  get_events,
  get_event,
  get_featured,
  get_upcoming,
  update_event,
  delete_event,
  get_organized_by,
  get_attended_by_me,
  get_analytics,
  mark_present,
  mark_absent,
  get_categories,
  get_tags,
  get_event_tags,
  get_can_review,
  cancel_event,
  get_admin_counts,
  get_all_events,
  delete_category,
  create_category,
  update_category,
  delete_tag,
  create_tag,
  update_tag,
};
