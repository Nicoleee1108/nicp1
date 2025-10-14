// handling the "adding" feature on the top of the home page.

import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";

type Props = {
  onPress?: () => void;
};
export default function AddingButton({ onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.text}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#111827", 
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontSize: 40,
    fontWeight: "700",
  },
});
