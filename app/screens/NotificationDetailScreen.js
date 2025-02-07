import React, { useEffect, useState } from 'react';
import { Text, View, TextInput, Button, Alert } from 'react-native';
import { AirbnbRating } from 'react-native-ratings';
import { auth } from '../config/firebase'
import QRCode from 'react-native-qrcode-svg';

export default function NotificationDetailScreen({ route }) {

    const { notification } = route.params;
    console.log('Notification:', notification);
    const [existingReview, setExistingReview] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [rating, setRating] = useState(0);
    const [qrData, setQrData] = useState(null);
    const user = auth.currentUser;

    useEffect(() => {
        const fetchExistingReview = async () => {
            try{
                const firebaseUID = user?.uid;
                const response = await fetch(`https://au-festio.vercel.app/api/organizers/${notification.data.organizerId}/events/${notification.data.eventId}/feedbacks`);
                if (!response.ok) {
                    throw new Error('Failed to fetch existing review');
                }
                const data = await response.json();
                console.log('Existing review:', data);
                const userReview = data.find((review) => review.firebaseUID === firebaseUID);
                if (userReview) {
                    setExistingReview(userReview);
                    setFeedback(userReview.suggestion);
                    setRating(userReview.stars);
                }
            } catch (error) {
                console.error('Error fetching existing review:', error);
            }
        };
        fetchExistingReview();
    }, [notification.data.eventId, notification.data.organizerId, user]);

    const handleRatingCompleted = (rating = 0) => {
        setRating(rating);
    };

    const handleSubmitFeedback = () => {
        // Handle feedback submission logic here
        console.log('Feedback:', feedback);
        console.log('Rating:', rating);
        Alert.alert('Submit Feedback', 'Are you sure you want to submit your feedback?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Submit', onPress: async () => {
                try {
                    const firebaseUID = user?.uid;
                    const response = await fetch(`https://au-festio.vercel.app/api/organizers/${notification.data.organizerId}/events/${notification.data.eventId}/feedbacks`, {
                        method: 'POST',
                        headers: {
                        'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            firebaseUID: firebaseUID,
                            stars: rating,
                            suggestion: feedback,
                        }),
                    });
        
                    if (!response.ok) {
                    throw new Error('Failed to submit feedback');
                    }
        
                    const data = await response.json();
                    console.log('Feedback submitted:', data);
                    Alert.alert('Success', 'Your feedback has been submitted successfully.');
                } catch (error) {
                    console.error('Error submitting feedback:', error);
                    Alert.alert('Error', 'An error occurred while submitting your feedback. Please try again.');
                }
            }},
        ]);
    };
    const fetchCheckInQR = async (notification) => {
        if (!notification.data.studentId || !user.uid) return;
        try {
          const response = await fetch(`https://au-festio.vercel.app/api/organizers/${notification.data.organizerId}/events/${notification.data.eventId}/students/getcheckinqr?studentId=${notification.data.studentId}&firebaseUID=${user.uid}`);
          const data = await response.json();
          console.log("Check in QR code data:", data);
          if (data && data.qrCodeData) {
            setQrData(data.qrCodeData);
            console.log("Check in QR code data:", data.qrCodeData);
          } else {
            console.error("QR code data not found.");
          }
        } catch (error) {
          console.error("Error fetching check-in QR code:", error);
        }
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
                defaultRating={existingReview?.stars || 0}
                size={30}
                onFinishRating={handleRatingCompleted}
                isDisabled={!!existingReview}
            />
            <TextInput
                className="h-24 border border-gray-300 p-2 mt-5 mb-5"
                placeholder="Enter your feedback"
                value={feedback}
                onChangeText={setFeedback}
                multiline
                editable={!existingReview}
            />
            {!existingReview && (
            <Button title="Submit Feedback" onPress={handleSubmitFeedback} />
            )}
            </View>
        )}
        {notification.data.type === 'registration-confirmation' && (
            <View className="mt-5">
                <Button title="View QR Code" onPress={() => fetchCheckInQR(notification)} />
                {qrData ? (
                  <QRCode value={qrData} size={300} />
                ) : (
                    <Text className="text-lg text-gray-600 mt-5">No QR code available.</Text>
                )}
            </View>
        )}
        </View>
    );
}