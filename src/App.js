import React, { useState } from 'react';
import { Calendar, List, Modal, Button, Input, Row, Col, Typography } from 'antd';
import TextArea from 'antd/es/input/TextArea';

const App = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState({});
  const [eventData, setEventData] = useState({ name: '', date: '', time: '', description: '' });
  const [isModalVisible, setModalVisible] = useState(false);
  const [activeMonth, setActiveMonth] = useState(null);

  const holidays = [
    { date: '2024-12-25', name: "Christmas Day" },
    { date: '2024-07-04', name: "Independence Day" },
    { date: '2024-01-01', name: "New Year's Day" },
  ];

  const fetchEventsForDate = (date) => {
    const mockEvents = {
      "2024-12-25": [
        { name: "Christmas Dinner", time: "7:00 PM", description: "Family dinner" }
      ],
      "2024-12-31": [
        { name: "New Year Eve Party", time: "9:00 PM", description: "Celebration with friends" }
      ]
    };
    return mockEvents[date] || [];
  };

  const handleDateSelect = (date) => {
    const formattedDate = date.format("YYYY-MM-DD");
    setSelectedDate(formattedDate);
    const fetchedEvents = fetchEventsForDate(formattedDate);
    setEvents({ [formattedDate]: fetchedEvents });
  };

  const handleSaveEvent = () => {
    const newEvent = { ...eventData, date: selectedDate };
    const updatedEvents = [...(events[selectedDate] || []), newEvent];
    setEvents({ ...events, [selectedDate]: updatedEvents });
    setEventData({ name: '', date: '', time: '', description: '' });
    setModalVisible(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventData({ ...eventData, [name]: value });
  };

  const renderEventList = () => {
    const currentEvents = selectedDate && events[selectedDate] ? events[selectedDate] : [];
    return (
      <div style={{ padding: "20px", marginBottom: "20px", boxShadow: "0px 4px 8px rgba(0,0,0,0.1)", borderRadius: "8px", backgroundColor: "#fff" }}>
        <h3 style={{ fontSize: "1.5em", marginBottom: "10px" }}>Events for {selectedDate}</h3>
        <List
          size="small"
          bordered
          dataSource={currentEvents}
          renderItem={(event, index) => (
            <List.Item key={index}>
              <div style={{ fontSize: "1.2em" }}>
                <strong>{event.name}</strong> - {event.time}
                <div>{event.description}</div>
              </div>
            </List.Item>
          )}
        />
        <Button type="primary" onClick={() => setModalVisible(true)} style={{ marginTop: "10px" }}>
          Add Event
        </Button>
      </div>
    );
  };

  const renderHolidayList = () => {
    const activeMonthHolidays = holidays.filter((holiday) =>
      activeMonth && holiday.date.startsWith(activeMonth)
    );

    return (
      <div style={{ padding: "20px", boxShadow: "0px 4px 8px rgba(0,0,0,0.1)", borderRadius: "8px", backgroundColor: "#fff" }}>
        <h3 style={{ fontSize: "1.5em", marginBottom: "10px" }}>Holidays in {activeMonth}</h3>
        <List
          size="small"
          bordered
          dataSource={activeMonthHolidays}
          renderItem={(holiday, index) => (
            <List.Item key={index}>
              <Typography.Text strong>{holiday.name}</Typography.Text> ({holiday.date})
            </List.Item>
          )}
        />
      </div>
    );
  };

  const dateCellRender = (date) => {
    const formattedDate = date.format("YYYY-MM-DD");
    const isHoliday = holidays.some((holiday) => holiday.date === formattedDate);

    if (isHoliday) {
      return (
        <div style={{ backgroundColor: "#ff4d4f", color: "#fff", borderRadius: "4px", padding: "5px" }}>
          Holiday
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "#f7f7f7", minHeight: "100vh" }}>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <div style={{ padding: "20px", marginBottom: "20px", boxShadow: "0px 4px 8px rgba(0,0,0,0.1)", borderRadius: "8px", backgroundColor: "#fff" }}>
            <Calendar
              onSelect={handleDateSelect}
              onPanelChange={(date) => setActiveMonth(date.format("YYYY-MM"))}
              dateCellRender={dateCellRender}
            />
          </div>
        </Col>
        <Col xs={24} md={12}>
          {selectedDate && renderEventList()}
          {activeMonth && renderHolidayList()}
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
          placeholder="Event Time"
          value={eventData.time}
          name="time"
          onChange={handleInputChange}
          style={{ marginBottom: "10px" }}
        />
        <TextArea
          placeholder="Event Description"
          value={eventData.description}
          name="description"
          onChange={handleInputChange}
          rows={4}
        />
      </Modal>
    </div>
  );
};

export default App;
