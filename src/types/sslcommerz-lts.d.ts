declare module 'sslcommerz-lts' {
  export interface SSLCommerzConfig {
    store_id: string
    store_passwd: string
    is_live: boolean
  }

  export interface SSLCommerzPaymentData {
    total_amount: number
    currency: string
    tran_id: string
    success_url: string
    fail_url: string
    cancel_url: string
    ipn_url?: string
    shipping_method?: string
    product_name?: string
    product_category?: string
    product_profile?: string
    cus_name?: string
    cus_email?: string
    cus_add1?: string
    cus_add2?: string
    cus_city?: string
    cus_state?: string
    cus_postcode?: string
    cus_country?: string
    cus_phone?: string
    cus_fax?: string
  }

  export interface SSLCommerzValidationResponse {
    status: string
    tran_id: string
    amount: string
    currency: string
    card_type?: string
    card_no?: string
    store_amount?: string
    bank_tran_id?: string
    tran_date?: string
    [key: string]: any // fallback for extra fields
  }

  class SSLCommerzPayment {
    constructor(store_id: string, store_passwd: string, is_live: boolean)

    /**
     * Initialize a new payment
     */
    init(data: SSLCommerzPaymentData): Promise<{
      status: string
      GatewayPageURL: string
      [key: string]: any
    }>

    /**
     * Validate transaction from IPN or Success callback
     */
    validate(
      data: { val_id: string }
    ): Promise<SSLCommerzValidationResponse>
  }

  export = SSLCommerzPayment
}
