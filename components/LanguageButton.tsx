import { Language, useLanguage } from '@/hooks/useLanguage';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

interface LanguageButtonProps {
  onPress: () => void;
}

export function LanguageButton({ onPress }: LanguageButtonProps) {
  const { language } = useLanguage();

  const getLanguageDisplay = (lang: Language) => {
    switch (lang) {
      case 'en': return 'EN';
      case 'cn': return '中文';
      default: return 'EN';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginRight: 8,
      }}
    >
      <Ionicons 
        name="language" 
        size={14} 
        color="#6b7280" 
        style={{ marginRight: 4 }} 
      />
      <Text style={{ 
        fontSize: 12, 
        fontWeight: '600', 
        color: '#374151',
      }}>
        {getLanguageDisplay(language)}
      </Text>
    </Pressable>
  );
}
