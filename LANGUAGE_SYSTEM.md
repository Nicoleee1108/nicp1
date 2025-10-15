# Internationalization (i18n) System

This project now includes a complete internationalization system with support for English and Chinese languages.

## Files Created

### Language Files
- `locales/en.json` - English translations
- `locales/cn.json` - Chinese translations

### Language Hook
- `hooks/useLanguage.tsx` - Language context and translation hook

### Language Switcher Component
- `components/LanguageSwitcher.tsx` - Component to switch between languages

## How to Use

### 1. Using the Translation Function

In any component, import and use the `useTranslation` hook:

```tsx
import { useTranslation } from '@/hooks/useLanguage';

function MyComponent() {
  const t = useTranslation();
  
  return (
    <Text>{t('common.save')}</Text>
  );
}
```

### 2. Translation Keys

The translation keys are organized by page/section:

- `common.*` - Common words like "Save", "Cancel", "Delete"
- `navigation.*` - Navigation labels
- `home.*` - Home page text
- `medication.*` - Medication page text
- `bloodPressure.*` - Blood pressure page text
- `therapy.*` - Therapy page text

### 3. Using Parameters

For dynamic content, use parameters:

```tsx
// In translation file: "deleteConfirmation": "Are you sure you want to delete \"{name}\"? This action cannot be undone."
const message = t('medication.deleteConfirmation', { name: medicationName });
```

### 4. Language Switching

Add the language switcher to any component:

```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function MyComponent() {
  return (
    <View>
      <LanguageSwitcher />
      {/* Other content */}
    </View>
  );
}
```

### 5. Adding New Translations

1. Add the English text to `locales/en.json`
2. Add the corresponding Chinese translation to `locales/cn.json`
3. Use the `t()` function in your components

## Language Provider Setup

The `LanguageProvider` is already set up in `app/_layout.tsx` and wraps the entire app, so all components have access to the translation functions.

## Language Persistence

The selected language is automatically saved to AsyncStorage and restored when the app restarts.

## Adding New Languages

To add a new language:

1. Create a new JSON file in `locales/` (e.g., `fr.json` for French)
2. Add the language type to the `Language` type in `useLanguage.tsx`
3. Import and add the translations to the `translations` object
4. Update the language switcher component to include the new language
