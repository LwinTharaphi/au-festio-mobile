// export async function fetchEvents(firebaseUserId, page = 1, limit = 10) {
//   try {
//     // Fetch all organizers
//     const organizersResponse = await fetch('https://au-festio.vercel.app/api/event-organizers');
//     if (!organizersResponse.ok) throw new Error('Failed to fetch organizers');
//     const organizers = await organizersResponse.json();

//     const events = await Promise.all(
//       organizers.map(async (organizer) => {
//         const response = await fetch(`https://au-festio.vercel.app/api/organizers/${organizer._id}/events`);
//         if (!response.ok) throw new Error(`Failed to fetch events for organizer ${organizer._id}`);
//         const organizerEvents = await response.json();
//         // console.log("OrganizerEvents",organizerEvents);
//         if (!Array.isArray(organizerEvents.events) || organizerEvents.events.length === 0) {
//           console.log(`No events found for organizer ${organizer.name}`);
//           return [];
//         }

//         return Promise.all(
//           organizerEvents.events.map(async (event) => {
//             const isRegistered = await fetchEventByFirebaseUserId(organizer._id, event._id, firebaseUserId);
//             return {
//               ...event,
//               isRegistered: isRegistered !== undefined ? isRegistered : false,
//             };
//           })
//         );
//       })
//     );
//     return organizers.map((organizer, index) => ({
//       organizer,
//       events: events[index] || [],
//       metadata: events[index]?.metadata || {},
//     }));
//   } catch (error) {
//     console.error(error);
//     return []; // Return an empty array in case of error
//   }
// }

const eventsCache = { data: null, timestamp: 0 }; // Cache for events

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt < retries) await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error(`Failed to fetch data from ${url} after ${retries} attempts`);
}

export async function fetchEvents(firebaseUserId, page = 1, limit = 10, cacheDuration = 60000) {
  const now = Date.now();

  // Use cached data if it's still valid
  if (eventsCache.data && now - eventsCache.timestamp < cacheDuration) {
    console.log("Returning cached events data.");
    return eventsCache.data;
  }

  try {
    const organizers = await fetchWithRetry("https://au-festio.vercel.app/api/event-organizers");
    
    // Fetch events for all organizers in parallel
    const eventFetchPromises = organizers.map((organizer) =>
      fetchWithRetry(`https://au-festio.vercel.app/api/organizers/${organizer._id}/events?page=${page}&limit=${limit}`)
        .then((data) => ({ ...data, organizerId: organizer._id })) // Attach organizer ID
        .catch(() => ({ events: [], organizerId: organizer._id })) // Fail gracefully
    );

    const allEventsResults = await Promise.allSettled(eventFetchPromises);
    
    // Process results
    const eventsData = allEventsResults.map((result) =>
      result.status === "fulfilled" ? result.value : { events: [], organizerId: null }
    );

    // Flatten event list with organizer IDs
    const allEvents = eventsData.flatMap(({ events, organizerId }) =>
      events.map((event) => ({ ...event, organizerId }))
    );

    // Fetch user registration statuses in parallel
    const registeredStatusPromises = allEvents.map((event) =>
      fetchEventByFirebaseUserId(event.organizerId, event._id, firebaseUserId)
        .then((isRegistered) => ({ ...event, isRegistered }))
        .catch(() => ({ ...event, isRegistered: false }))
    );

    const updatedEvents = await Promise.allSettled(registeredStatusPromises);
    const finalEvents = updatedEvents.map((result) => (result.status === "fulfilled" ? result.value : null)).filter(Boolean);

    // Reconstruct data grouped by organizers
    const finalData = organizers.map((organizer) => ({
      organizer,
      events: finalEvents.filter((event) => event.organizerId === organizer._id),
      metadata: eventsData.find((data) => data.organizerId === organizer._id)?.metadata || {},
    }));

    // Store in cache
    eventsCache.data = finalData;
    eventsCache.timestamp = now;

    console.log("Successfully fetched all events!");
    return finalData;
  } catch (error) {
    console.error("Error fetching events:", error.message);
    return [];
  }
}

export async function fetchEventByFirebaseUserId(organizerId, eventId, firebaseUserId) {
  try {
    const response = await fetch(`https://au-festio.vercel.app/api/organizers/${organizerId}/events/${eventId}/students`);
    
    if (!response.ok) throw new Error("Failed to fetch event students");

    const students = await response.json();
    if (!Array.isArray(students)) return false;

    const latestStudent = students
      .filter((student) => student.firebaseUID === firebaseUserId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]; // Get latest registration

    return latestStudent ? latestStudent.refundStatus !== "refunded" : false;
  } catch (error) {
    console.error(error);
    return false; // Assume not registered on failure
  }
}
