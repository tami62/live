import React, { useState } from "react";
import { generateClient } from "aws-amplify/api";
import { Schema} from "../../amplify/data/resource";
const client = generateClient<Schema>();

const PerformerForm: React.FC = () => {
  const [name, setName] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [performanceDescription, setPerformanceDescription] = useState("");
  const [performances, setPerformances] = useState<string[]>([]);
  const [availableTime, setAvailableTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  // Function to handle adding performance descriptions to the list
  const addPerformance = () => {
    if (performanceDescription.trim() !== "") {
      setPerformances([...performances, performanceDescription]);
      setPerformanceDescription("");
    }
  };

  // Function to handle adding available times to the list
  const addAvailableTime = () => {
    if (availableTime.trim() !== "") {
      setAvailableTimes([...availableTimes, availableTime]);
      setAvailableTime("");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const { data: newPerformer } = await client.models.Performer.create({
        name,
        skills: selectedSkills,
        performances,
        availableTimes,
      });
      console.log("Performer saved successfully:", newPerformer);
      // Clear form or provide success message
    } catch (error) {
      console.error("Error saving performer:", error);
      // Handle error
    }
  };

  // Sample list of available skills (replace with your own)
  const allSkills = ["Singing", "Dancing", "Acting", "Musician", "Magician"];

  return (
    <form onSubmit={handleSubmit}>
      {/* Name Input */}
      <div>
        <label htmlFor="name">Performer Name:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Selectable Skills (using checkboxes as an example) */}
      <div>
        <label>Skills:</label>
        {allSkills.map((skill) => (
          <div key={skill}>
            <input
              type="checkbox"
              id={skill}
              value={skill}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedSkills([...selectedSkills, skill]);
                } else {
                  setSelectedSkills(
                    selectedSkills.filter((s) => s !== skill)
                  );
                }
              }}
            />
            <label htmlFor={skill}>{skill}</label>
          </div>
        ))}
      </div>

      {/* Free-form Performances */}
      <div>
        <label htmlFor="performance">Performance Description:</label>
        <textarea
          id="performance"
          value={performanceDescription}
          onChange={(e) => setPerformanceDescription(e.target.value)}
        />
        <button type="button" onClick={addPerformance}>
          Add Performance
        </button>
      </div>
      <div>
        <h4>Performances List:</h4>
        <ul>
          {performances.map((perf, index) => (
            <li key={index}>{perf}</li>
          ))}
        </ul>
      </div>

      {/* Available Times */}
      <div>
        <label htmlFor="availableTime">Available Time:</label>
        <input
          type="text" // Or use date/time picker components
          id="availableTime"
          value={availableTime}
          onChange={(e) => setAvailableTime(e.target.value)}
        />
        <button type="button" onClick={addAvailableTime}>
          Add Available Time
        </button>
      </div>
      <div>
        <h4>Available Times List:</h4>
        <ul>
          {availableTimes.map((time, index) => (
            <li key={index}>{time}</li>
          ))}
        </ul>
      </div>

      <button type="submit">Save Performer</button>
    </form>
  );
};

export default PerformerForm;
