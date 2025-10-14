import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import TimePickerBottomSheet from './TimePickerBottomSheet';

interface ReminderTimeRowProps {
  index: number;
  date: Date;
  onTimeChange: (index: number, newTime: Date) => void;
  onDelete: (index: number) => void;
}

export default function ReminderTimeRow({
  index,
  date,
  onTimeChange,
  onDelete,
}: ReminderTimeRowProps) {
  const [showTimePicker, setShowTimePicker] = useState(false);

  const timeString = date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const handleEdit = () => {
    setShowTimePicker(true);
  };

  const handleTimeSave = (newTime: Date) => {
    onTimeChange(index, newTime);
    setShowTimePicker(false);
  };

  const handleTimeCancel = () => {
    setShowTimePicker(false);
  };

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          borderWidth: 1,
          borderColor: '#e5e7eb',
          borderRadius: 8,
          backgroundColor: '#f9fafb',
        }}
      >
        <Text style={{ flex: 1, fontWeight: '600' }}>{timeString}</Text>
        
        <Pressable
          onPress={handleEdit}
          style={{
            marginRight: 8,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: '#d1d5db',
            borderRadius: 6,
            backgroundColor: '#fff',
          }}
        >
          <Text style={{ fontWeight: '600', color: '#374151' }}>Edit</Text>
        </Pressable>
        
        <Pressable
          onPress={() => onDelete(index)}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: '#fca5a5',
            borderRadius: 6,
            backgroundColor: '#fef2f2',
          }}
        >
          <Text style={{ fontWeight: '600', color: '#dc2626' }}>Delete</Text>
        </Pressable>
      </View>

      <TimePickerBottomSheet
        visible={showTimePicker}
        initialTime={date}
        onSave={handleTimeSave}
        onCancel={handleTimeCancel}
      />
    </>
  );
}
