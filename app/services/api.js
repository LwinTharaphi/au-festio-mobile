export async function fetchEvents(firebaseUserId, page = 1, limit = 10) {
  try {
    // Fetch all organizers
    const organizersResponse = await fetch('https://au-festio.vercel.app/api/event-organizers');
    if (!organizersResponse.ok) throw new Error('Failed to fetch organizers');
    const organizers = await organizersResponse.json();

    const events = await Promise.all(
      organizers.map(async (organizer) => {
        const response = await fetch(`https://au-festio.vercel.app/api/organizers/${organizer._id}/events`);
        if (!response.ok) throw new Error(`Failed to fetch events for organizer ${organizer._id}`);
        const organizerEvents = await response.json();
        // console.log("OrganizerEvents",organizerEvents);
        if (!Array.isArray(organizerEvents.events) || organizerEvents.events.length === 0) {
          console.log(`No events found for organizer ${organizer.name}`);
          return [];
        }

        return Promise.all(
          organizerEvents.events.map(async (event) => {
            const isRegistered = await fetchEventByFirebaseUserId(organizer._id, event._id, firebaseUserId);
            return {
              ...event,
              isRegistered: isRegistered !== undefined ? isRegistered : false,
            };
          })
        );
      })
    );
    return organizers.map((organizer, index) => ({
      organizer,
      events: events[index] || [],
      metadata: events[index]?.metadata || {},
    }));
  } catch (error) {
    console.error(error);
    return []; // Return an empty array in case of error
  }
}

export async function fetchEventByFirebaseUserId(organizerId, eventId, firebaseUserId) {
  try {
    const response = await fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/students`);
    
    if (!response.ok) throw new Error("Failed to fetch event students");

    const students = await response.json();

    // Ensure students array exists
    if (!Array.isArray(students)) return false;

    // Get all student records for the user
    const userRegistrations = students
      .filter(student => student.firebaseUID === firebaseUserId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by latest first

    if (userRegistrations.length === 0) {
      return false; // No records, allow registration
    }

    const latestStudent = userRegistrations[0]; // Get the latest student record

    // If the latest record is not refunded, return true (already registered)
    return latestStudent.refundStatus !== "refunded";
  } catch (error) {
    console.error(error);
    return false; // Return false if any error occurs
  }
}


