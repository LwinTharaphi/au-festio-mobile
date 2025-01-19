export async function fetchEvents(firebaseUserId) {
  try {
    // Fetch all organizers
    const organizersResponse = await fetch('https://au-festio.vercel.app/api/event-organizers');
    if (!organizersResponse.ok) throw new Error('Failed to fetch organizers');
    const organizers = await organizersResponse.json();

    // Fetch events for each organizer
    const eventPromises = organizers.map(async (organizer) => {
      const response = await fetch(`https://au-festio.vercel.app/api/organizers/${organizer._id}/events`);
      if (!response.ok) throw new Error(`Failed to fetch events for organizer ${organizer._id}`);
      const organizerEvents = await response.json();

      // console.log(JSON.stringify(organizerEvents,null,2));

      // Handle case where organizerEvents may be undefined or empty
      if (!Array.isArray(organizerEvents) || organizerEvents.length === 0) {
        console.log(`No events found for organizer ${organizer.name}`);
        return [];  // Return an empty array if no events are found
      }

      // Add registration status to each event
      const eventsWithRegistrationStatus = await Promise.all(organizerEvents.map(async (event) => {
        const isRegistered = await fetchEventByFirebaseUserId(organizer._id, event._id, firebaseUserId);
        return {
          ...event,
          isRegistered: isRegistered !== undefined ? isRegistered : false, // Add the registration status to the event object
        };
      }));

      return eventsWithRegistrationStatus;
    });

    // Wait for all event fetches to complete
    const events = await Promise.all(eventPromises);

    // Combine organizers with their respective events
    const organizersWithEvents = organizers.map((organizer, index) => ({
      organizer,
      events: events[index] || [], // Attach the events for each organizer
    }));

    // Return the structured data
    return organizersWithEvents;
  } catch (error) {
    console.error(error);
    return []; // Return an empty array in case of error
  }
}


export async function fetchEventByFirebaseUserId(organizerId, eventId, firebaseUserId) {
  try {
    const response = await fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/students`);
    if (!response.ok) throw new Error('Failed to fetch event students');
    const students = await response.json();
    console.log("students",students);

    // Ensure students array exists and is an array
    return Array.isArray(students) && students.some((student) => student.firebaseUID === firebaseUserId);
  } catch (error) {
    console.error(error);
    return false;  // Return false if any error occurs
  }
}


