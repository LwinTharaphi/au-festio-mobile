import React, { useState } from 'react';
import { Text, View, TextInput, Button } from 'react-native';
import { AirbnbRating } from 'react-native-ratings';

export default function NotificationDetailScreen({ route }) {
  const { notification } = route.params;
  console.log('Notification:', notification);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);

  const handleRatingCompleted = (rating = 0) => {
    setRating(rating);
  };

  const handleSubmitFeedback = () => {
    // Handle feedback submission logic here
    console.log('Feedback:', feedback);
    console.log('Rating:', rating);
  };

  return (
    <View className="flex-1 p-5 bg-white">
      <Text className="text-2xl font-bold mb-2">{notification.title}</Text>
      <Text className="text-lg text-gray-600 mb-5">{notification.body}</Text>
      {notification.data.type === 'feedback-reminder' && (
        <View className="mt-5">
          <AirbnbRating
            count={5}
            reviews={['Terrible', 'Bad', 'Okay', 'Good', 'Great']}
            defaultRating={0}
            size={30}
            onFinishRating={handleRatingCompleted}
          />
          <TextInput
            className="h-24 border border-gray-300 p-2 mt-5 mb-5"
            placeholder="Enter your feedback"
            value={feedback}
            onChangeText={setFeedback}
            multiline
          />
          <Button title="Submit Feedback" onPress={handleSubmitFeedback} />
        </View>
      )}
    </View>
  );
}