export async function fetchEvents() {
    try {
      const response = await fetch('http://10.120.218.69:3000/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  }
  