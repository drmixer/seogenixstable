import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, schema_type } = await req.json()

    if (!url || !schema_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: url and schema_type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract domain name for use in schema
    const domain = new URL(url).hostname
    const siteName = domain.replace('www.', '').split('.')[0]
    
    // Generate schema based on type
    let schema = {}
    
    switch (schema_type) {
      case 'FAQ':
        schema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": `What services does ${siteName} offer?`,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `${siteName} offers comprehensive services designed to help businesses succeed online. Visit ${url} to learn more about our offerings and how we can help you achieve your goals.`
              }
            },
            {
              "@type": "Question",
              "name": "How can I get started?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Getting started is easy! Simply contact us through our website or give us a call to discuss your specific needs and requirements."
              }
            },
            {
              "@type": "Question",
              "name": "What makes your services unique?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our services are tailored to each client's specific needs, ensuring personalized solutions that deliver real results and value."
              }
            }
          ]
        }
        break

      case 'HowTo':
        schema = {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": `How to Get Started with ${siteName}`,
          "description": `A step-by-step guide to getting started with ${siteName} services.`,
          "image": `${url}/images/how-to-guide.jpg`,
          "totalTime": "PT30M",
          "estimatedCost": {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": "0"
          },
          "step": [
            {
              "@type": "HowToStep",
              "name": "Contact our team",
              "text": "Reach out to our team through our website contact form or phone number.",
              "image": `${url}/images/step1.jpg`
            },
            {
              "@type": "HowToStep",
              "name": "Schedule consultation",
              "text": "We'll schedule a consultation to understand your specific requirements and goals.",
              "image": `${url}/images/step2.jpg`
            },
            {
              "@type": "HowToStep",
              "name": "Begin your journey",
              "text": "Start working with our team to implement tailored solutions for your needs.",
              "image": `${url}/images/step3.jpg`
            }
          ]
        }
        break

      case 'Product':
        schema = {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": `${siteName} Professional Services`,
          "description": "High-quality professional services tailored to meet your specific business needs and objectives.",
          "brand": {
            "@type": "Brand",
            "name": siteName
          },
          "offers": {
            "@type": "Offer",
            "availability": "https://schema.org/InStock",
            "url": url,
            "priceCurrency": "USD",
            "seller": {
              "@type": "Organization",
              "name": siteName
            }
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "127"
          }
        }
        break

      case 'LocalBusiness':
        schema = {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": siteName,
          "url": url,
          "description": "Professional local business providing quality services to the community.",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "123 Business Street",
            "addressLocality": "Your City",
            "addressRegion": "Your State",
            "postalCode": "12345",
            "addressCountry": "US"
          },
          "telephone": "+1-555-123-4567",
          "openingHours": "Mo-Fr 09:00-17:00",
          "priceRange": "$$"
        }
        break

      case 'Article':
        schema = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": `Professional Services and Solutions - ${siteName}`,
          "description": "Learn about our comprehensive range of professional services and how they can benefit your business.",
          "url": url,
          "datePublished": new Date().toISOString(),
          "dateModified": new Date().toISOString(),
          "author": {
            "@type": "Organization",
            "name": siteName,
            "url": url
          },
          "publisher": {
            "@type": "Organization",
            "name": siteName,
            "url": url
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": url
          }
        }
        break

      case 'Event':
        schema = {
          "@context": "https://schema.org",
          "@type": "Event",
          "name": `Professional Consultation - ${siteName}`,
          "description": "Schedule a consultation to discuss your needs and learn about our services.",
          "url": url,
          "startDate": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          "endDate": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          "eventStatus": "https://schema.org/EventScheduled",
          "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
          "location": {
            "@type": "Place",
            "name": siteName,
            "url": url
          },
          "organizer": {
            "@type": "Organization",
            "name": siteName,
            "url": url
          }
        }
        break

      case 'Organization':
        schema = {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": siteName,
          "url": url,
          "description": "Professional organization providing quality services and solutions to help businesses succeed.",
          "foundingDate": "2020",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+1-555-123-4567",
            "contactType": "customer service",
            "availableLanguage": "English"
          },
          "sameAs": [
            `https://www.linkedin.com/company/${siteName.toLowerCase()}`,
            `https://twitter.com/${siteName.toLowerCase()}`,
            `https://www.facebook.com/${siteName.toLowerCase()}`
          ]
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: `Unsupported schema type: ${schema_type}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    // Return the generated schema as a formatted JSON string
    const response = {
      schema: JSON.stringify(schema, null, 2)
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error generating schema:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})