import React, { useState, useEffect } from "react";
import {
  Calendar,
  List,
  Modal,
  Button,
  Input,
  Row,
  Col,
  Typography,
  Upload,
  TimePicker,
  message,
  Popconfirm,
} from "antd";
import {
  UploadOutlined,
  PlusOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import moment from "moment";
import { fetchEvents, addEvent, updateEvent, deleteEvent } from "./Api"; // Import the API functions

const App = () => {
  const [selectedDate, setSelectedDate] = useState(moment());
  const [events, setEvents] = useState({});
  const [eventData, setEventData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    description: "",
    image: null,
  });
  const [isModalVisible, setModalVisible] = useState(false);
  const [activeView, setActiveView] = useState("daily");
  const [activeMonth, setActiveMonth] = useState(moment().format("YYYY-MM"));
  const [selectedEventId, setSelectedEventId] = useState(null); // To store the ID of the event being updated

  const holidays = [
    { date: "2024-12-25", name: "Christmas Day" },
    { date: "2025-08-15", name: "Independence Day" },
    { date: "2025-01-01", name: "New Year's Day" },
    { date: "2025-01-14", name: "Makar Sankranti" },
  ];

  const loadEvents = async () => {
    const payload = {
      eventDate: selectedDate.format("YYYY-MM-DD"),
    };

    try {
      const response = await fetchEvents(payload);
      if (response.code === 200) {
        const eventList = response.data;
        const eventsByDate = eventList.reduce((acc, event) => {
          const date = moment(event.eventDate).format("YYYY-MM-DD"); // Format the date to compare
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(event);
          return acc;
        }, {});

        setEvents(eventsByDate);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      message.error("Failed to fetch events.");
    }
  };

  useEffect(() => {
    loadEvents();
  }, [selectedDate]);
  
  const renderDateCell = (value) => {
    const dateStr = value.format("YYYY-MM-DD");
  
    // Check if the date has events
    const hasEvents = events[dateStr] && events[dateStr].length > 0;
  
    // Check if the date is a holiday
    const isHoliday = holidays.some((holiday) => holiday.date === dateStr);
  
    // Render custom content for dates with events or holidays
    // return (
    //   <div>
    //     <div>{value.date()}</div>
    //     {hasEvents && <div style={{ color: "blue" }}>📅</div>}
    //     {isHoliday && <div style={{ color: "red" }}>🎉</div>}
    //   </div>
    // );
  };
  
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleAddEvent = async () => {
    const { name, startTime, endTime, description } = eventData;

    // Validate mandatory fields
    if (!name || !startTime || !endTime || !description) {
      message.error("Please fill in all required fields.");
      return;
    }
    const eventTime = `${startTime} - ${endTime}`;
    const newEvent = {
      eventName: name,
      eventDescription: description,
      eventTime: eventTime,
      eventDate: selectedDate.format("YYYY-MM-DD"),
    };

    try {
      const response = await addEvent(newEvent); // Use the addEvent API
      if (response.code === 200) {
        const updatedEvents = {
          ...events,
          [selectedDate.format("YYYY-MM-DD")]: [
            ...(events[selectedDate.format("YYYY-MM-DD")] || []),
            { ...newEvent, _id: response.data._id }, // Assign _id from API response
          ],
        };
        setEvents(updatedEvents);

        // Reset form data
        setEventData({
          name: "",
          startTime: "",
          endTime: "",
          description: "",
          image: null,
        });
        setModalVisible(false);
        message.success("Event added successfully!");
      } else {
        message.error("Failed to add event.");
      }
    } catch (error) {
      console.error("Error adding event:", error);
      message.error("Failed to add event.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventData({ ...eventData, [name]: value });
  };

  const handleImageUpload = (info) => {
    setEventData({ ...eventData, image: info.file });
  };

  const shareEventDetails = () => {
    if (!events[selectedDate.format("YYYY-MM-DD")]?.length) {
      message.warning("No events to share!");
      return;
    }

    const eventDetails = events[selectedDate.format("YYYY-MM-DD")]
      .map(
        (event) =>
          `${event.name},(${event.startTime} - ${event.endTime})\nDescription: ${event.description}`
      )
      .join("\n\n");

    message.success("Event details prepared for sharing!");
    console.log("Share Event Details:\n" + eventDetails);
  };

  const filterEvents = () => {
    const selectedMoment = selectedDate;
    const eventDates = Object.keys(events);
    const filteredEvents = [];

    eventDates.forEach((date) => {
      const eventMoment = moment(date);

      if (activeView === "daily" && eventMoment.isSame(selectedMoment, "day")) {
        filteredEvents.push(...events[date]);
      } else if (
        activeView === "weekly" &&
        eventMoment.isBetween(
          selectedMoment.clone().startOf("week"),
          selectedMoment.clone().endOf("week"),
          null,
          "[]"
        )
      ) {
        filteredEvents.push(...events[date]);
      } else if (
        activeView === "daily" &&
        eventMoment.isSame(selectedMoment, "month")
      ) {
        filteredEvents.push(...events[date]);
      }
    });

    return filteredEvents;
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const response = await deleteEvent(eventId); // Call the delete API with eventId
      console.log("Delete API Raw Response:", response); // Debug the raw response

      const updatedEvents = { ...events };
      Object.keys(updatedEvents).forEach((date) => {
        updatedEvents[date] = updatedEvents[date].filter(
          (event) => event._id !== eventId
        );
      });
      setEvents(updatedEvents);
      message.success("Event deleted successfully!");
    } catch (error) {
      console.error("Error deleting event:", error);
      message.error("Failed to delete the event.");
    }
  };

  const confirmDelete = (eventId) => {
    handleDeleteEvent(eventId);
    message.success('Event deleted successfully!');
  };

  const cancelDelete = () => {
    message.info('Delete action cancelled');
  };

  const handleUpdateEvent = (event) => {
    setEventData({
      name: event.eventName,
      startTime: event.startTime,
      endTime: event.endTime,
      description: event.eventDescription,
      image: event.image || null,
    });
    setSelectedEventId(event._id); // Set the event ID for the update
    setModalVisible(true); // Open the modal
  };

  const handleSaveUpdatedEvent = async () => {
    const { name, description } = eventData;
  
    // Validate mandatory fields
    if (!name || !description) {
      message.error("Please fill in all required fields.");
      return;
    }
  
    const updatedEvent = {
      eventName: name,
      eventDescription: description,
      eventDate: selectedDate.format("YYYY-MM-DD"),
      image: eventData.image, // Include optional image
    };
  
    try {
      const response = await updateEvent(selectedEventId, updatedEvent); // Use the update API
      if (response.code === 200) {
        // Update the events state with the new event details
        const updatedEvents = { ...events };
        Object.keys(updatedEvents).forEach((date) => {
          updatedEvents[date] = updatedEvents[date].map((event) =>
            event._id === selectedEventId
              ? { ...event, ...updatedEvent }
              : event
          );
        });
        setEvents(updatedEvents);
        message.success("Event updated successfully!");
        setModalVisible(false); // Close the modal after update
      } else {
        message.error("Failed to update event.");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      message.error("Failed to update event.");
    }
  };
  

  const resetForm = () => {
    setEventData({
      name: "",
      startTime: "",
      endTime: "",
      description: "",
      image: null,
    });
    setSelectedEventId(null);
  };

  const renderEventList = () => {
    const filteredEvents = filterEvents(); // Get the events based on the selected view

    return (
      <div
        style={{
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
          borderRadius: "8px",
          backgroundColor: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <h3 style={{ fontSize: "1.5em" }}>
            Events ({activeView.charAt(0).toUpperCase() + activeView.slice(1)})
          </h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              Add Event
            </Button>
            <Button
              type="primary"
              icon={<ShareAltOutlined />}
              onClick={shareEventDetails}
            >
              Share
            </Button>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <Button
            type={activeView === "daily" ? "primary" : "default"}
            onClick={() => setActiveView("daily")}
          >
            Daily
          </Button>
          <Button
            type={activeView === "weekly" ? "primary" : "default"}
            onClick={() => setActiveView("weekly")}
          >
            Weekly
          </Button>
          <Button
            type={activeView === "monthly" ? "primary" : "default"}
            onClick={() => setActiveView("monthly")}
          >
            Monthly
          </Button>
        </div>
        <div
          style={{
            maxHeight: "300px", // Adjust this to set the maximum height
            overflowY: "auto", // Enables scrolling when content exceeds maxHeight
            border: "1px solid #f0f0f0",
            borderRadius: "8px",
            padding: "10px",
          }}
        >
          <List
            size="small"
            dataSource={filteredEvents}
            renderItem={(event, index) => (
              <List.Item key={index}>
                <div style={{ fontSize: "1.2em" }}>
                  <strong>{event.eventName || "Unnamed Event"}</strong>
                  <div>
                    <strong>Time:</strong> {event.eventTime || "Unknown Time"}
                  </div>
                  <div>
                    <strong>Description:</strong>{" "}
                    {event.eventDescription || "No description provided."}
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <Button
                      type="primary"
                      onClick={() => handleUpdateEvent(event)}
                    >
                      Update
                    </Button>
                    {/* <Button
                      type="danger"
                      onClick={() => handleDeleteEvent()}
                      style={{ marginLeft: "10px" }}
                    >
                      Delete
                    </Button> */}
                    <Popconfirm
                      title="Are you sure you want to delete this event?"
                      onConfirm={() => confirmDelete(event._id)}
                      onCancel={cancelDelete}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button color="danger" variant="solid" style={{ marginLeft: "10px" }}>
                        Delete
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      </div>
    );
  };

  const renderHolidayList = () => {
    const activeMonthHolidays = holidays.filter((holiday) =>
      holiday.date.startsWith(activeMonth)
    );

    return (
      <div
        style={{
          padding: "20px",
          boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
          borderRadius: "8px",
          backgroundColor: "#fff",
        }}
      >
        <h3 style={{ fontSize: "1.5em", marginBottom: "10px" }}>
          Holidays in {activeMonth}
        </h3>
        <List
          size="small"
          bordered
          dataSource={activeMonthHolidays}
          renderItem={(holiday, index) => (
            <List.Item key={index}>
              <Typography.Text strong>{holiday.name}</Typography.Text> (
              {holiday.date})
            </List.Item>
          )}
        />
      </div>
    );
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f7f7f7",
        minHeight: "100vh",
      }}
    >
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <div
            style={{
              padding: "20px",
              marginBottom: "20px",
              boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
              borderRadius: "8px",
              backgroundColor: "#fff",
            }}
          >
            <Calendar
  onSelect={handleDateSelect}
  onPanelChange={(date) => setActiveMonth(date.format("YYYY-MM"))}
  dateCellRender={(date) => {
    const formattedDate = date.format("YYYY-MM-DD");

    // Check for events on the current date
    const eventsForDate = events[formattedDate] || [];

    // Check for holidays on the current date
    const holiday = holidays.find((h) => h.date === formattedDate);

    return (
      <div>
        {/* Render events */}
        {eventsForDate.map((event, index) => (
          <div key={index} style={{ color: "blue",textAlign:'right',fontSize: '12px' }}>
            <p><b style={{fontSize:'14px'}}>{event.eventName}</b><br/>({event.eventTime})</p>
          </div>
        ))}

        {/* Render holiday */}
        {holiday && (
          <div style={{ color: "red", fontWeight: "bolder",textAlign:'right',fontSize: '12px' }}>
            {holiday.name}
          </div>
        )}
      </div>
    );
  }}
/>

          </div>
        </Col>
        <Col xs={24} md={12}>
          {renderEventList()}
          {renderHolidayList()}
        </Col>
      </Row>

      <Modal
        title={selectedEventId ? "Update Event" : "Add Event"} // Dynamic title
        open={isModalVisible}
        onCancel={() => {
          setModalVisible(false);
          resetForm(); // Clear the form and state when closing the modal
        }}
        onOk={selectedEventId ? handleSaveUpdatedEvent : handleAddEvent} // Switch function based on context
        okText={selectedEventId ? "Update Event" : "Add Event"} // Dynamic button text
        cancelText="Cancel"
      >
        <Input
          placeholder="Event Name"
          value={eventData.name}
          name="name"
          onChange={handleInputChange}
          style={{ marginBottom: "10px" }}
        />
        <Button
          type="primary"
          icon={<ShareAltOutlined />}
          onClick={shareEventDetails}
        >
          Share
        </Button>

        <TimePicker
  placeholder="Start Time"
  value={
    eventData.startTime ? moment(eventData.startTime, "h:mm A") : null
  }
  onChange={(time) =>
    setEventData({ ...eventData, startTime: time.format("h:mm A") })
  }
  style={{ marginBottom: "10px", width: "100%" }}
  use12Hours
  format="h:mm A"
  disabled={!!selectedEventId} // Disable field during update
/>

<TimePicker
  placeholder="End Time"
  value={eventData.endTime ? moment(eventData.endTime, "h:mm A") : null}
  onChange={(time) =>
    setEventData({ ...eventData, endTime: time.format("h:mm A") })
  }
  style={{ marginBottom: "10px", width: "100%" }}
  use12Hours
  format="h:mm A"
  disabled={!!selectedEventId} // Disable field during update
/>

        <TextArea
          placeholder="Event Description"
          value={eventData.description}
          name="description"
          onChange={handleInputChange}
          rows={4}
          style={{ marginBottom: "10px" }}
        />
        <Upload beforeUpload={() => false} onChange={handleImageUpload}>
          <Button icon={<UploadOutlined />}>Upload Image</Button>
          <Button
            type="primary"
            icon={<ShareAltOutlined />}
            onClick={shareEventDetails}
          >
            Share
          </Button>
        </Upload>
      </Modal>
    </div>
  );
};

export default App;
