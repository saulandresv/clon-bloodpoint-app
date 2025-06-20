import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.page.html',
  styleUrls: ['./chatbot.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, FormsModule, CommonModule]
})
export class ChatbotPage implements OnInit {
  newMessage: string = '';
  messages: { text: string; sender: 'user' | 'bot' }[] = [
    { text: '¡Hola! Soy chatblood. ¿En qué puedo ayudarte?', sender: 'bot' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {}

  sendMessage() {
    if (!this.newMessage.trim()) return;

    const userText = this.newMessage;
    this.messages.push({ text: userText, sender: 'user' });
    this.newMessage = '';

    this.http.post<{ validacion: string; response: string }>('https://bloodpoint-core-qa-35c4ecec4a30.herokuapp.com/ask/', {
      prompt: userText
    }).subscribe({
      next: (res) => {
        let respuesta = res.response;

        // Añadir emojis según la validación
        if (res.validacion === 'no') {
          respuesta = '❌ ' + respuesta;
        } else if (res.validacion === 'no sé') {
          respuesta = '🤔 ' + respuesta;
        } else {
          respuesta = '✅ ' + respuesta;
        }

        this.messages.push({ text: respuesta, sender: 'bot' });
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Error en la comunicación:', err);
        this.messages.push({ 
          text: 'Lo siento, en este momento no puedo procesar tu consulta. Por favor, intenta más tarde.', 
          sender: 'bot' 
        });
        this.scrollToBottom();
      }
    });
  }

  scrollToBottom() {
    const el = document.getElementById('chat-content');
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
