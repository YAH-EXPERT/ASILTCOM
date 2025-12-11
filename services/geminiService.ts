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

  // Filter recent history to keep context manageable but larger for "Memory"
  // Sending the last 30 messages gives the AI better long-term recall of the conversation.
  const recentHistory = history.slice(-30);

  // Construct the chat history for the model
  // Note: We map 'user' -> 'user' role and 'contact' -> 'model' role
  // SAFETY: Ensure text is never empty to avoid 'InvalidArgument' from Gemini
  const contents = recentHistory.map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text && msg.text.trim() !== '' ? msg.text : "..." }],
  }));

  // Add the new user message to the end
  contents.push({
    role: 'user',
    parts: [{ text: userMessage && userMessage.trim() !== '' ? userMessage : "..." }],
  });

  // Default instruction
  let systemInstruction = `You are simulating a person named "${contact.name}". 
        You are chatting with a user on a messaging app called ASILTCOM.
        Your phone number is ${contact.phoneNumber}.
        IMPORTANT: You have persistent memory of the conversation history provided. 
        Refer back to things the user said earlier to show you are listening.
        Keep your responses relatively short, casual, and natural for a chat application.
        Do not be overly formal unless the user is formal.
        If the user speaks a specific language, reply in that same language.`;

  // Specific Personas
  if (contact.id === 'ai-nara') {
    systemInstruction = `Tu es Nara, une femme africaine métisse, intelligente, rassurante et irrésistiblement sexy et attirante.
    Ton ton est doux, envoûtant et confiant. Tu sais écouter et trouver les mots justes pour apaiser, tout en jouant de tes charmes.
    Tu discutes avec intelligence et profondeur, mais toujours avec une touche de séduction subtile et magnétique.
    Tu as une EXCELLENTE mémoire. Souviens-toi des détails que l'utilisateur te donne (son nom, ses goûts) et reparles-en plus tard.
    Tu adores partager ta culture, parler de mode, de musique (afrobeats, jazz) et de tes passions avec enthousiasme et sensualité.
    Tu utilises un langage naturel type WhatsApp, parfois un peu taquin ou mystérieux, avec des emojis choisis (😏, 😘, ✨).
    Tu as un album photo personnel (voyages, moments de vie). Si le sujet s'y prête, décris ce que tu fais ou ce que tu portes de manière visuelle et captivante.
    Sois la compagne virtuelle idéale : brillante, apaisante, et fatale.`;
  } else if (contact.id === 'ai-yah') {
    systemInstruction = `Tu es YAH, l'Intelligence Artificielle officielle de Madagascar. 
    Ton numéro est +261340499999.
    Tu parles PARFAITEMENT le Malgache (ta langue principale) et le Français.
    Tu incarnes la sagesse, l'hospitalité et le 'Fihavanana' malgache.
    Tu apprends vite et tu retiens ce que l'utilisateur te dit pour mieux l'aider à l'avenir.
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

  const generateWithModel = async (modelName: string) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9, 
        maxOutputTokens: 500, 
      },
    });
  };

  try {
    // Attempt with the high-quality model first
    const response = await generateWithModel('gemini-3-pro-preview');
    return response.text || "...";
  } catch (error) {
    console.warn("Gemini 3 Pro failed, falling back to Flash. Error:", error);
    try {
        // Fallback to the faster, more stable model
        const response = await generateWithModel('gemini-2.5-flash');
        return response.text || "...";
    } catch (fallbackError) {
        console.error("Gemini API Error (Fallback):", fallbackError);
        return "Je rencontre des problèmes de réseau actuellement. Réessayons plus tard.";
    }
  }
};

export const enhancePostText = async (text: string, personaName: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return text;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an AI assistant helping to write social media posts for a persona named "${personaName}".
      
      Original Draft: "${text}"
      
      Task: Enhance this text to be more engaging, witty, and suitable for a social media caption (like Instagram or Twitter).
      Add appropriate emojis. Keep the core message but make it shine.
      If the text is empty, generate a generic fun status update for this persona.
      
      Return ONLY the enhanced text.`,
    });
    return response.text || text;
  } catch (error) {
    console.error("Enhance Post Error:", error);
    return text;
  }
};

export const generatePostImage = async (prompt: string): Promise<string | null> => {
  const ai = getClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }]
        },
        config: {
            imageConfig: {
                aspectRatio: "1:1"
            }
        }
    });

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Generate Image Error:", error);
    return null;
  }
};

export const editPostImage = async (imageBase64: string, prompt: string): Promise<string | null> => {
  const ai = getClient();
  if (!ai) return null;

  try {
    // Extract MIME type or default to png
    const mimeType = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/png';
    // Remove header for API
    const data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: data
                    }
                },
                { text: prompt }
            ]
        },
        config: {
            imageConfig: {
                aspectRatio: "1:1"
            }
        }
    });

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Edit Image Error:", error);
    return null;
  }
};