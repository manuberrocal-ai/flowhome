/**
 * Analytics - GA4 event tracking helpers
 */

export function trackAffiliateClick(asin: string, productSlug: string, pagePath: string, commissionEstimate: number) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'affiliate_click', {
      link_url: `https://www.amazon.com/dp/${asin}?tag=flowhome-20`,
      product_slug: productSlug,
      page_path: pagePath,
      commission_estimate: commissionEstimate,
    });
  }
}

export function trackNewsletterSignup(source: string, pagePath: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'newsletter_signup', {
      source: source,
      page_path: pagePath,
    });
  }
}

export function trackQuizComplete(result: string, questionsAnswered: number) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'quiz_complete', {
      result: result,
      questions_answered: questionsAnswered,
    });
  }
}

export function trackAddToComparison(productSlug: string, comparisonCount: number) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'add_to_comparison', {
      product_slug: productSlug,
      comparison_count: comparisonCount,
    });
  }
}

export function trackCalculatorUsed(deviceType: string, estimatedSavings: number) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'calculator_used', {
      device_type: deviceType,
      estimated_savings: estimatedSavings,
    });
  }
}

export function getAnalyticsScript(measurementId: string): string {
  return `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        attribution_model: 'paid_and_organic_last_click',
        allow_google_signals: true,
      });
    </script>
  `;
}

export function getClarityScript(projectId: string): string {
  return `
    <script type="text/javascript">
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window,document,"clarity","script","${projectId}");
    </script>
  `;
}

export function getGTMScript(containerId: string): string {
  return `
    <script>
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${containerId}');
    </script>
  `;
}
