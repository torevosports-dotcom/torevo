const RazorpayCheckout = {
  open: async (_options: any): Promise<any> => {
    throw new Error('Razorpay is not available on web')
  },
}
export default RazorpayCheckout
