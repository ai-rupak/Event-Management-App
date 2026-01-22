// providers/StripeWrapper.tsx
import { getPublishableKey } from '@/api/stripe'
import { StripeProvider } from '@stripe/stripe-react-native'
import { useQuery } from '@tanstack/react-query'

export default function StripeWrapper({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ['payment', 'pub-key'],
    queryFn: getPublishableKey,
  })

  if (isLoading) return null // or splash screen

  return (
    <StripeProvider publishableKey={data.publishableKey}>
      {children as React.ReactElement | React.ReactElement[]}
      {/* {children} */}
    </StripeProvider>

  )
}
