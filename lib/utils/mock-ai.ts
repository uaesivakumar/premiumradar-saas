import { Industry } from '@/lib/stores/industry-store';

/**
 * Mock AI Response Generator
 * Generates contextual responses based on user input and detected industry
 */

const industryResponses: Record<Industry, string[]> = {
  banking: [
    "I can help you analyze fintech competitors in your region. PremiumRadar tracks 500+ banking and fintech companies across the GCC, monitoring their product launches, pricing changes, and digital innovations.",
    "Based on our analysis, digital banking adoption in the region has grown 40% year-over-year. Key trends include mobile-first experiences, AI-powered customer service, and embedded finance solutions.",
    "I've identified 12 direct competitors in your banking segment. Would you like me to generate a detailed comparison of their digital features, pricing tiers, or customer satisfaction metrics?",
  ],
  healthcare: [
    "PremiumRadar monitors 300+ healthcare technology providers in the region. I can track telemedicine platforms, hospital management systems, and medical device companies.",
    "Healthcare technology investment in the GCC reached $2.1B last year. The fastest-growing segments are telehealth (65% growth), AI diagnostics (48% growth), and patient engagement platforms.",
    "I've mapped your competitive landscape across 8 key healthcare verticals. Your top 5 competitors have recently launched new features. Would you like a detailed analysis?",
  ],
  technology: [
    "I'm tracking 1,200+ technology companies in your sector. PremiumRadar monitors product updates, pricing changes, funding rounds, and market positioning in real-time.",
    "SaaS pricing in your segment has increased 15% on average this year. I've identified 3 competitors who recently changed their pricing strategy. Want me to analyze the impact?",
    "Your competitive landscape shows 23 direct competitors and 45 adjacent players. I can generate feature comparison matrices, pricing analysis, or go-to-market strategy insights.",
  ],
  retail: [
    "PremiumRadar tracks 800+ retail and e-commerce companies across the region. I monitor pricing changes, promotional strategies, inventory signals, and customer sentiment.",
    "E-commerce in the GCC is projected to reach $50B by 2025. Key competitive factors include delivery speed, return policies, and loyalty program effectiveness.",
    "I've detected 156 price changes from your competitors this week. Would you like me to generate a price intelligence report or track specific products?",
  ],
  manufacturing: [
    "I monitor 400+ manufacturing companies and their supply chain partners. PremiumRadar tracks capacity utilization, technology adoption, and sustainability initiatives.",
    "Industry 4.0 adoption in the region has accelerated, with 60% of manufacturers investing in smart factory technologies. Your competitors are focusing on predictive maintenance and quality control AI.",
    "I've identified efficiency benchmarks across your manufacturing segment. Your top competitors have improved production efficiency by 23% through automation investments.",
  ],
  realestate: [
    "PremiumRadar tracks 600+ real estate developers, property managers, and PropTech companies. I monitor project launches, pricing trends, and market sentiment.",
    "The regional real estate market shows strong recovery with 18% price appreciation in prime segments. New project launches are up 35% compared to last year.",
    "I've mapped 45 comparable properties in your target area. Would you like a detailed pricing analysis, amenity comparison, or demand forecast?",
  ],
  'professional-services': [
    "I track 250+ consulting firms, legal practices, and professional service providers. PremiumRadar monitors service offerings, pricing models, and client wins.",
    "Professional services in the region are seeing 12% annual growth. Key differentiators include digital transformation expertise, industry specialization, and regional knowledge.",
    "Your competitive analysis shows 18 firms competing for similar clients. I can provide detailed comparisons of their service portfolios, pricing, and market positioning.",
  ],
  general: [
    "Welcome to PremiumRadar! I'm your AI-powered competitive intelligence assistant. Tell me about your industry, and I'll help you track competitors, analyze market trends, and identify opportunities.",
    "PremiumRadar monitors thousands of companies across the GCC region. I can help you with competitor tracking, price monitoring, market analysis, and strategic insights. What industry are you in?",
    "I can help you understand your competitive landscape. Share your industry or company name, and I'll provide relevant insights about market trends, competitor activities, and growth opportunities.",
  ],
};

const genericResponses = [
  "That's a great question! Based on the data I'm tracking, ",
  "I've analyzed this across our database. Here's what I found: ",
  "Let me share some insights from our competitive intelligence platform: ",
];

export async function generateMockResponse(
  userInput: string,
  industry: Industry
): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const lowerInput = userInput.toLowerCase();

  // Check for specific intents
  if (lowerInput.includes('competitor') || lowerInput.includes('منافس')) {
    return industryResponses[industry][0];
  }

  if (lowerInput.includes('trend') || lowerInput.includes('market') || lowerInput.includes('سوق') || lowerInput.includes('اتجاه')) {
    return industryResponses[industry][1];
  }

  if (lowerInput.includes('compare') || lowerInput.includes('analysis') || lowerInput.includes('مقارن') || lowerInput.includes('تحليل')) {
    return industryResponses[industry][2];
  }

  if (lowerInput.includes('price') || lowerInput.includes('pricing') || lowerInput.includes('سعر')) {
    return `${genericResponses[Math.floor(Math.random() * genericResponses.length)]}pricing intelligence is one of our core capabilities. I can track competitor pricing in real-time, detect promotional patterns, and alert you to market changes. Would you like to set up price monitoring for specific competitors?`;
  }

  if (lowerInput.includes('help') || lowerInput.includes('what can') || lowerInput.includes('مساعد') || lowerInput.includes('ماذا')) {
    return "PremiumRadar is an AI-powered competitive intelligence platform designed for the GCC market. I can help you:\n\n• Track competitor activities and product launches\n• Monitor pricing changes and promotional strategies\n• Analyze market trends and opportunities\n• Generate competitive intelligence reports\n• Set up alerts for important market movements\n\nTell me about your industry to get started!";
  }

  // Default response based on industry
  const responses = industryResponses[industry];
  return responses[Math.floor(Math.random() * responses.length)];
}
