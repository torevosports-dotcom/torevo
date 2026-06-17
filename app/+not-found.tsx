import { View, Text } from 'react-native'
import { Link } from 'expo-router'
export default function NotFound() {
  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Text className="text-zinc-900 text-lg font-bold">Screen not found</Text>
      <Link href="/" className="text-indigo-600 mt-4">Go home</Link>
    </View>
  )
}
