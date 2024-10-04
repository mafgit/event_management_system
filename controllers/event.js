const db = require("../db");

const create_event = (req, res) => {
  const {
    name,
    description,
    capacity,
    venue,
    organized_by,
    event_date,
    start_time,
    end_time,
    category,
    status,
    verified,
    image_url,
  } = req.body;

  const q =
    "INSERT INTO events (name, description, capacity, venue, organized_by, event_date, start_time, end_time, category, status, verified, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
  db.execute(
    q,
    [
      name,
      description,
      capacity,
      venue,
      organized_by,
      event_date,
      start_time,
      end_time,
      category,
      status,
      verified,
      image_url,
    ],
    (err, results) => {
      if (err) res.status(500).json({ success: false, error: error.message });
      else res.status(201).json({ success: true, event_id: results.insertId });
    }
  );
};


const get_events = (req, res) => {
  const q = "SELECT * FROM events;";
  db.query(q, (err, results) => {
    if (err) 
    return res.status(500).json({ success: false, error: err.message });
    res.status(200).json({ success: true, events: results });
  });
};

const get_event = (req, res) => {
  const { id } = req.params;
  const q = "SELECT * FROM events WHERE id = ?;";
  db.query(q, [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (result.length === 0) return res.status(404).json({ success: false, message: "Event not found" });
    res.status(200).json({ success: true, event: result[0] });
  });
};


const update_event = (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    capacity,
    venue,
    organized_by,
    event_date,
    start_time,
    end_time,
    category,
    status,
    verified,
    image_url,
  } = req.body;

  const q =
    "UPDATE events SET name = ?, description = ?, capacity = ?, venue = ?, organized_by = ?, event_date = ?, start_time = ?, end_time = ?, category = ?, status = ?, verified = ?, image_url = ? WHERE id = ?;";
  db.execute(
    q,
    [
      name,
      description,
      capacity,
      venue,
      organized_by,
      event_date,
      start_time,
      end_time,
      category,
      status,
      verified,
      image_url,
      id,
    ],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (results.affectedRows === 0) return res.status(404).json({ success: false, message: "Event not found" });
      res.status(200).json({ success: true, message: "Event updated successfully" });
    }
  );
};


const delete_event = (req, res) => {
  const { id } = req.params;
  const q = "DELETE FROM events WHERE id = ?;";
  db.execute(q, [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (results.affectedRows === 0) return res.status(404).json({ success: false, message: "Event not found" });
    res.status(200).json({ success: true, message: "Event deleted successfully" });
  });
};


module.exports = {
  create_event,
  get_events,
  get_event,
  update_event,
  delete_event
};
