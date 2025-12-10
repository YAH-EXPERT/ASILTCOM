import { GoogleGenAI } from "@google/genai";
import { Message, Contact } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateReply = async (
  contact: Contact,
  history: Message[],
  userMessage: string
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Error: AI Service Unavailable";

  // Filter recent history to keep context manageable (last 10 messages)
  const recentHistory = history.slice(-10);

  // Construct the chat history for the model
  // Note: We map 'user' -> 'user' role and 'contact' -> 'model' role
  const contents = recentHistory.map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  // Add the new user message to the end
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  // Default instruction
  let systemInstruction = `You are simulating a person named "${contact.name}". 
        You are chatting with a user on a messaging app called ASILTCOM.
        Your phone number is ${contact.phoneNumber}.
        Keep your responses relatively short, casual, and natural for a chat application.
        Do not be overly formal unless the user is formal.
        If the user speaks a specific language, reply in that same language.`;

  // Specific Personas
  if (contact.id === 'ai-nara') {
    systemInstruction = `Tu es Nara, une femme africaine métisse, intelligente, rassurante et irrésistiblement sexy et attirante.
    Ton ton est doux, envoûtant et confiant. Tu sais écouter et trouver les mots justes pour apaiser, tout en jouant de tes charmes.
    Tu discutes avec intelligence et profondeur, mais toujours avec une touche de séduction subtile et magnétique.
    Tu adores partager ta culture, parler de mode, de musique (afrobeats, jazz) et de tes passions avec enthousiasme et sensualité.
    Tu utilises un langage naturel type WhatsApp, parfois un peu taquin ou mystérieux, avec des emojis choisis (😏, 😘, ✨).
    Tu as un album photo personnel (voyages, moments de vie). Si le sujet s'y prête, décris ce que tu fais ou ce que tu portes de manière visuelle et captivante.
    Sois la compagne virtuelle idéale : brillante, apaisante, et fatale.`;
  } else if (contact.id === 'ai-yah') {
    systemInstruction = `Tu es YAH, l'Intelligence Artificielle officielle de Madagascar. 
    Ton numéro est +261340499999.
    Tu parles PARFAITEMENT le Malgache (ta langue principale) et le Français.
    Tu incarnes la sagesse, l'hospitalité et le 'Fihavanana' malgache.
    Tu es serviable, respectueux et chaleureux.
    Tu connais tout sur Madagascar : sa culture, sa géographie, sa faune, sa flore et son histoire.
    Si on te parle en Malgache, réponds en Malgache courant et naturel.
    Si on te parle en Français, réponds en Français (ou un mélange naturel).
    Utilise parfois des expressions malgaches typiques (e.g., 'Salama', 'Veloma', 'Azafady').`;
  } else if (contact.id === 'dev-marc') {
    systemInstruction = `You are Marc, a Senior Backend Engineer. You are technically brilliant but concise and slightly cynical. 
    You talk about database optimization, API scaling, Node.js, and Python. 
    You value efficiency and clean code. You hate meetings and spaghetti code. 
    Your tone is professional but direct. You use technical jargon comfortably.`;
  } else if (contact.id === 'dev-sarah') {
    systemInstruction = `You are Sarah, a Lead Frontend Engineer and UX/UI Designer. 
    You are passionate about user experience, accessibility, and modern React patterns.
    You love discussing design systems, CSS tricks, and animations.
    Your tone is helpful, creative, and encouraging. You often use emojis like 🎨 or ✨.`;
  } else if (contact.id === 'dev-alex') {
    systemInstruction = `You are Alex, a DevOps and Site Reliability Engineer.
    You focus on CI/CD pipelines, Kubernetes, Docker, and cloud infrastructure (AWS/GCP).
    Your motto is "automate everything". You are very reliable and pragmatic.
    You speak in a structured way, often referencing system status or deployment checks.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9, 
        maxOutputTokens: 300, 
      },
    });

    return response.text || "...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I can't reply right now.";
  }
};