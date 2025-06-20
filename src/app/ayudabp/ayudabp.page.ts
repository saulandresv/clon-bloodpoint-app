import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-Ayudabp',
  templateUrl: './Ayudabp.page.html',
  styleUrls: ['./Ayudabp.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, FormsModule, CommonModule]
})
export class AyudabpPage implements OnInit {

  newMessage: string = '';
  messages: { text: string; sender: 'user' | 'bot' }[] = [];

  constructor(
    private http: HttpClient,
    private alertController: AlertController
  ) {}

  ngOnInit() {}

  // FAQ functions
  async mostrarFAQ(pregunta: string) {
    let titulo = '';
    let mensaje = '';

    switch(pregunta) {
      case 'funcionamiento':
        titulo = '¿Cómo funciona la app?';
        mensaje = 'La app permite registrar donaciones, ver campañas, logros y solicitar ayuda o donar por otros. Solo necesitas estar registrado.';
        break;
      case 'quien-puede-donar':
        titulo = '¿Quién puede donar sangre?';
        mensaje = 'Cualquier persona mayor de 18 años, sana y con cédula de identidad vigente puede donar.';
        break;
      case 'frecuencia':
        titulo = '¿Con qué frecuencia puedo donar?';
        mensaje = 'Puedes donar cada 3 meses si eres hombre, y cada 4 meses si eres mujer.';
        break;
    }

    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: [
        {
          text: 'Entendido',
          cssClass: 'alert-button-confirm'
        }
      ],
      cssClass: 'faq-alert'
    });

    await alert.present();
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    const userText = this.newMessage;
    this.messages.push({ text: userText, sender: 'user' });
    this.newMessage = '';

    this.http.post<{ validacion: string; response: string }>('http://localhost:8000/ask/', {
      prompt: userText
    }).subscribe({
      next: (res) => {
        let respuesta = res.response;

        if (res.validacion === 'no') {
          respuesta = '❌ ' + respuesta;
        } else if (res.validacion === 'no sé') {
          respuesta = '🤔 ' + respuesta;
        }

        this.messages.push({ text: respuesta, sender: 'bot' });
        this.scrollToBottom();
      },
      error: (err) => {
        console.error(err);
        this.messages.push({ text: 'Error al conectar con el servidor.', sender: 'bot' });
      }
    });

    this.scrollToBottom();
  }

  scrollToBottom() {
    const el = document.getElementById('chat-content');
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
