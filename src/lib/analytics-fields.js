/** Shared allowlist for the browser sanitizer and the reviewed GTM draft builder. */
export const ANALYTICS_EVENT_FIELDS = Object.freeze(Object.fromEntries(Object.entries({
  page_view: ['page_type'],
  affiliate_click: ['page_type', 'cta_position', 'product_slug', 'category', 'discount'],
  list_add: ['page_type', 'cta_position', 'product_slug', 'category'],
  quiz_start: ['page_type'],
  quiz_complete: ['page_type', 'goal', 'ecosystem', 'budget', 'installation', 'extra', 'result_count'],
  calculator_used: ['page_type', 'device_type', 'estimated_savings'],
  compare_open: ['page_type', 'cta_position'],
  feed_follow: ['page_type', 'cta_position'],
  experiment_exposure: ['page_type', 'experiment_id', 'variant_id', 'assignment_version', 'mutual_exclusion_group', 'assignment_bucket'],
}).map(([event, fields]) => [event, Object.freeze(fields)])));
