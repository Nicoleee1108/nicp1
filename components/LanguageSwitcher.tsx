import { Language, useLanguage } from '@/hooks/useLanguage';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLanguage: Language = language === 'en' ? 'cn' : 'en';
    setLanguage(newLanguage);
  };

  return (
    <Pressable
      onPress={toggleLanguage}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
      }}
    >
      <Ionicons 
        name="language" 
        size={16} 
        color="#6b7280" 
        style={{ marginRight: 6 }} 
      />
      <Text style={{ 
        fontSize: 14, 
        fontWeight: '600', 
        color: '#374151',
        textTransform: 'uppercase'
      }}>
        {language}
      </Text>
    </Pressable>
  );
}
