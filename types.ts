
export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: GroundingSource[];
  imageUrl?: string;
  userImageUrl?: string; // Image uploaded by user
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}
