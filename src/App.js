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
        const eventList = await fetchEvents(payload);
        const eventsByDate = eventList.reduce((acc, event) => {
          const date = event.date;
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(event);
          return acc;
        }, {});
        setEvents(eventsByDate);
      } catch (error) {
        console.error("Error fetching events:", error);
        message.error("Failed to fetch events.");
      }
    };
    loadEvents()
  }, [selectedDate]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);

  };

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
        eventMoment.isSame(selectedMoment, "week")
      ) {
        filteredEvents.push(...events[date]);
      } else if (
        activeView === "monthly" &&
        eventMoment.isSame(selectedMoment, "month")
      ) {
        filteredEvents.push(...events[date]);
      }
    });

    return filteredEvents;
  };

  const renderEventList = () => {
    const filteredEvents = filterEvents();

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
          dataSource={filteredEvents}
          renderItem={(event, index) => (
            <List.Item key={index}>
              <div style={{ fontSize: "1.2em" }}>
                <strong>{event.name}</strong> at {event.place} (
                {event.startTime} - {event.endTime})
                <div>{event.description}</div>
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
        title="Add Event"
        visible={isModalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSaveEvent}
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
        <Input
          placeholder="Event Place"
          value={eventData.place}
          name="place"
          onChange={handleInputChange}
          style={{ marginBottom: "10px" }}
        />
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
        </Upload>
      </Modal>
    </div>
  );
};

export default App;
