export async function fetchEvents() {
  try {
    // Fetch all organizers
    const organizersResponse = await fetch('https://au-festio.vercel.app/api/event-organizers');
    if (!organizersResponse.ok) throw new Error('Failed to fetch organizers');
    const organizers = await organizersResponse.json();

    // Fetch events for each organizer
    const eventPromises = organizers.map((organizer) =>
      fetch(`https://au-festio.vercel.app/api/organizers/${organizer._id}/events`)
        .then((response) => {
          if (!response.ok) throw new Error(`Failed to fetch events for organizer ${organizer._id}`);
          return response.json();
        })
        .catch((error) => {
          console.error(error);
          return []; // Return an empty array if fetching fails for an organizer
        })
    );

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

