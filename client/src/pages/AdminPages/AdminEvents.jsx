import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Input,
  Form,
  message,
  DatePicker,
  TimePicker,
  Checkbox,
} from "antd";
import axios from "axios";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import moment from "moment";

const AdminEvents = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false); // New state for creating event
  const [form] = Form.useForm();

  // Fetch Data from API
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/events/get_events");
      setData(response.data.events);
    } catch (error) {
      message.error("Failed to fetch data");
    }
    setLoading(false);

    //   setData([
    // {
    //   event_id: 1,
    //   name: "Tech Innovators Conference",
    //   description:
    //     "A gathering of leading tech innovators to discuss future trends.",
    //   capacity: 300,
    //   venue: "Downtown Convention Center",
    //   organized_by: 101,
    //   event_date: "2024-11-15",
    //   start_time: "09:00",
    //   end_time: "17:00",
    //   category: "Technology",
    //   status: "Upcoming",
    //   verified: true,
    //   created_at: "2024-09-10T08:30:00",
    //   modified_at: "2024-10-01T12:45:00",
    //   image_url: "https://example.com/images/tech_conference.jpg",
    // },
    //     {
    //       event_id: 2,
    //       name: "Music and Arts Festival",
    //       description:
    //         "An outdoor celebration of music and the arts with local and international artists.",
    //       capacity: 5000,
    //       venue: "City Park",
    //       organized_by: 203,
    //       event_date: "2024-12-03",
    //       start_time: "12:00",
    //       end_time: "23:00",
    //       category: "Entertainment",
    //       status: "Upcoming",
    //       verified: false,
    //       created_at: "2024-08-25T14:00:00",
    //       modified_at: "2024-09-15T09:10:00",
    //       image_url: "https://example.com/images/music_festival.jpg",
    //     },
    //     {
    //       event_id: 3,
    //       name: "Charity Gala Dinner",
    //       description:
    //         "A formal event to raise funds for local charities, featuring dinner and entertainment.",
    //       capacity: 200,
    //       venue: "Grand Hotel Ballroom",
    //       organized_by: 305,
    //       event_date: "2024-11-25",
    //       start_time: "18:30",
    //       end_time: "22:00",
    //       category: "Charity",
    //       status: "Upcoming",
    //       verified: true,
    //       created_at: "2024-09-30T11:20:00",
    //       modified_at: "2024-10-05T10:00:00",
    //       image_url: "https://example.com/images/charity_gala.jpg",
    //     },
    //   ]);
  };

  // Delete Row
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/events/delete_event/${id}`);
      message.success("Event deleted successfully");
      fetchData(); // Refresh data after deletion
    } catch (error) {
      message.error("Failed to delete event");
    }
  };

  // Edit Row
  const handleEdit = (record) => {
    setIsEditing(true);
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      event_date: moment(record.event_date, "YYYY-MM-DD"),
      start_time: moment(record.start_time, "HH:mm"),
      end_time: moment(record.end_time, "HH:mm"),
    }); // Prepopulate form with current row data
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false); // Reset create modal
    form.resetFields();
  };

  // Save Edited Data
  const handleSave = async () => {
    try {
      await axios.put(
        `/events/update_event/${editingRecord.event_id}`,
        form.getFieldsValue()
      );
      message.success("Event updated successfully");
      setIsEditing(false);
      fetchData(); // Refresh data after edit
    } catch (error) {
      message.error("Failed to update event");
    }
  };

  // Handle Create New Event
  const handleCreate = async () => {
    try {
      await axios.post("/events/create_event", form.getFieldsValue());
      message.success("Event created successfully");
      setIsCreating(false);
      fetchData(); // Refresh data after event creation
    } catch (error) {
      message.error("Failed to create event");
    }
  };

  // Define Table Columns
  const columns = [
    {
      title: "Event ID",
      dataIndex: "event_id",
      sorter: (a, b) => a.event_id - b.event_id,
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Description",
      dataIndex: "description",
    },
    {
      title: "Capacity",
      dataIndex: "capacity",
      sorter: (a, b) => a.capacity - b.capacity,
    },
    {
      title: "Venue",
      dataIndex: "venue",
    },
    {
      title: "Organized By",
      dataIndex: "organized_by",
    },
    {
      title: "Image URL",
      dataIndex: "image_url",
    },
    {
      title: "Event Date",
      dataIndex: "event_date",
      render: (event_date) => moment(event_date).format("YYYY-MM-DD"),
    },
    {
      title: "Start Time",
      dataIndex: "start_time",
    },
    {
      title: "End Time",
      dataIndex: "end_time",
    },
    {
      title: "Category",
      dataIndex: "category",
    },
    {
      title: "Status",
      dataIndex: "status",
    },
    {
      title: "Verified",
      dataIndex: "verified",
      render: (verified) => (verified ? "Yes" : "No"),
    },
    {
      title: "Actions",
      render: (text, record) => (
        <>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ marginRight: 8 }}
          />
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.event_id)}
            danger
          />
        </>
      ),
    },
  ];

  // Handle Row Selection
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  return (
    <div>
      <div className="flex justify-between py-3 pb-0 px-6">
        <h1 className="text-lg font-bold">Events</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ marginBottom: 16 }}
          onClick={() => setIsCreating(true)}
        >
          Create Event
        </Button>
      </div>

      <Table
        rowSelection={{
          type: "checkbox",
          ...rowSelection,
        }}
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="event_id"
        pagination={{ pageSize: 5 }} // Adjust page size as needed
      />

      {/* Edit Modal */}
      <Modal
        title="Edit Event"
        visible={isEditing}
        onCancel={handleCancel}
        onOk={handleSave}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: "Please input the event name!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please input the description!" },
            ]}
          >
            <Input.TextArea />
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Capacity"
            rules={[{ required: true, message: "Please input the capacity!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="venue" label="Venue">
            <Input />
          </Form.Item>

          <Form.Item name="image_url" label="Image URL">
            <Input />
          </Form.Item>

          <Form.Item
            name="event_date"
            label="Event Date"
            rules={[
              { required: true, message: "Please input the event date!" },
            ]}
          >
            <DatePicker />
          </Form.Item>

          <Form.Item
            name="start_time"
            label="Start Time"
            rules={[
              { required: true, message: "Please input the start time!" },
            ]}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="end_time"
            label="End Time"
            rules={[{ required: true, message: "Please input the end time!" }]}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>

          <Form.Item name="category" label="Category">
            <Input />
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Input />
          </Form.Item>

          <Form.Item name="verified" label="Verified" valuePropName="checked">
            <Checkbox>Is Verified</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Modal */}
      <Modal
        title="Create Event"
        visible={isCreating}
        onCancel={handleCancel}
        onOk={handleCreate}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: "Please input the event name!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please input the description!" },
            ]}
          >
            <Input.TextArea />
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Capacity"
            rules={[{ required: true, message: "Please input the capacity!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="venue" label="Venue">
            <Input />
          </Form.Item>

          <Form.Item
            name="event_date"
            label="Event Date"
            rules={[
              { required: true, message: "Please input the event date!" },
            ]}
          >
            <DatePicker />
          </Form.Item>

          <Form.Item
            name="start_time"
            label="Start Time"
            rules={[
              { required: true, message: "Please input the start time!" },
            ]}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="end_time"
            label="End Time"
            rules={[{ required: true, message: "Please input the end time!" }]}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>

          <Form.Item name="category" label="Category">
            <Input />
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Input />
          </Form.Item>

          <Form.Item name="verified" valuePropName="checked">
            <Checkbox>Is Verified</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminEvents;
