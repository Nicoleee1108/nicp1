import { Language, useLanguage, useTranslation } from '@/hooks/useLanguage';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';

interface LanguagePopupProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguagePopup({ visible, onClose }: LanguagePopupProps) {
  const { language, setLanguage } = useLanguage();
  const t = useTranslation();

  const languages = [
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
    { code: 'cn' as Language, name: '中文', flag: '🇨🇳' },
  ];

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }}
        onPress={onClose}
      >
        <View
          style={{
            position: 'absolute',
            top: 100,
            right: 20,
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 16,
            minWidth: 200,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#111827',
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            {t('common.selectLanguage')}
          </Text>
          
          {languages.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => handleLanguageSelect(lang.code)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderRadius: 8,
                backgroundColor: language === lang.code ? '#f0f9ff' : 'transparent',
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 12 }}>
                {lang.flag}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: language === lang.code ? '600' : '500',
                  color: language === lang.code ? '#1e40af' : '#374151',
                }}
              >
                {lang.name}
              </Text>
              {language === lang.code && (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color="#1e40af"
                  style={{ marginLeft: 'auto' }}
                />
              )}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}
