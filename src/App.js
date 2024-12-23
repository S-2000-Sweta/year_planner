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
    place: "",
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

  // Fetch events when the component is mounted
  useEffect(() => {
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
  
    loadEvents();
    console.log("Updated Events State:", events); // Debugging to check updated events
  }, [selectedDate]);
  
  const handleDateSelect = (date) => {
    setSelectedDate(date);

  };
  useEffect(() => {
    console.log("Updated Events State:", events);
  }, [events]);
  

  const handleSaveEvent = async () => {
    const { name, place, startTime, endTime, description } = eventData;

    // Validate mandatory fields
    if (!name || !place || !startTime || !endTime || !description) {
      message.error("Please fill in all required fields.");
      return;
    }

    const newEvent = {
      eventName: eventData.name,
      eventDescription: eventData.description,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      place: eventData.place,
      eventDate: selectedDate.format("YYYY-MM-DD"),
    };

    try {
      // Add event using the API
      const response = await addEvent(newEvent);
      if (response.code === 200) {
        const updatedEvents = {
          ...events,
          [selectedDate.format("YYYY-MM-DD")]: [
            ...(events[selectedDate.format("YYYY-MM-DD")] || []),
            newEvent,
          ],
        };
        setEvents(updatedEvents);

        // Reset form data
        setEventData({
          name: "",
          place: "",
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
          `${event.name} at ${event.place} (${event.startTime} - ${event.endTime})\nDescription: ${event.description}`
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
      const response = await deleteEvent(eventId); // Call your API to delete the event
      if (response.code === 200) {
        // Remove the event from the state after successful deletion
        const updatedEvents = { ...events };
        Object.keys(updatedEvents).forEach((date) => {
          updatedEvents[date] = updatedEvents[date].filter(
            (event) => event._id !== eventId
          );
        });
        setEvents(updatedEvents);
        message.success("Event deleted successfully!");
      } else {
        message.error("Failed to delete event.");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      message.error("Failed to delete event.");
    }
  };

  const handleUpdateEvent = (event) => {
    setEventData({
      name: event.eventName,
      place: event.place,
      startTime: event.eventTime.split(" - ")[0],
      endTime: event.eventTime.split(" - ")[1],
      description: event.eventDescription,
      image: event.image || null,
    });
    setSelectedEventId(event._id);  // Set the selected event ID
    setModalVisible(true);           // Open the update modal
  };
  
  
  const handleSaveUpdatedEvent = async () => {
    const { name, place, startTime, endTime, description, image } = eventData;
  
    // Validate mandatory fields
    if (!name || !place || !startTime || !endTime || !description) {
      message.error("Please fill in all required fields.");
      return;
    }
  
    const updatedEvent = {
      eventName: name,
      eventDescription: description,
      eventTime: `${startTime} - ${endTime}`,
      place,
      eventDate: selectedDate.format("YYYY-MM-DD"),
      image, // Optionally update the image
    };
  
    try {
      const response = await updateEvent(selectedEventId, updatedEvent); // Call API to update the event
      if (response.code === 200) {
        // Update the events state with the new event details
        const updatedEvents = { ...events };
        Object.keys(updatedEvents).forEach((date) => {
          updatedEvents[date] = updatedEvents[date].map((event) =>
            event._id === selectedEventId ? { ...event, ...updatedEvent } : event
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
              type="default"
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
        <List
          size="small"
          bordered
          dataSource={filteredEvents} // Pass filtered events based on the selected view
          renderItem={(event, index) => (
            <List.Item key={index}>
              <div style={{ fontSize: "1.2em" }}>
                <strong>{event.eventName || "Unnamed Event"}</strong>
                <div>
                  <strong>Place:</strong> {event.place || "Unknown Place"}
                </div>
                <div>
                  <strong>Time:</strong> {event.eventTime || "Unknown Time"}
                </div>
                <div>
                  <strong>Description:</strong> {event.eventDescription || "No description provided."}
                </div>
                <div style={{ marginTop: "10px" }}>
                  <Button
                    type="primary"
                    onClick={() => handleUpdateEvent(event)} // Trigger the update modal
                  >
                    Update
                  </Button>
                  <Button
                    type="danger"
                    onClick={() => handleDeleteEvent(event._id)} // Trigger the delete
                    style={{ marginLeft: "10px" }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </List.Item>
          )}
        />
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
            />
          </div>
        </Col>
        <Col xs={24} md={12}>
          {renderEventList()}
          {renderHolidayList()}
        </Col>
      </Row>

      <Modal
  title="Update Event"
  visible={isModalVisible}
  onCancel={() => setModalVisible(false)}
  onOk={handleSaveUpdatedEvent} // Call the function to update the event
  okText="Save Event"
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
              type="default"
              icon={<ShareAltOutlined />}
              onClick={shareEventDetails}
            >
              Share
            </Button>
  <Input
    placeholder="Event Place"
    value={eventData.place}
    name="place"
    onChange={handleInputChange}
    style={{ marginBottom: "10px" }}
  />
  <TimePicker
    placeholder="Start Time"
    value={eventData.startTime ? moment(eventData.startTime, "h:mm A") : null}
    onChange={(time) =>
      setEventData({ ...eventData, startTime: time.format("h:mm A") })
    }
    style={{ marginBottom: "10px", width: "100%" }}
    use12Hours
    format="h:mm A"
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
              type="default"
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
