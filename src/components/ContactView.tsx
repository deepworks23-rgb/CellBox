import React, { useState } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { MotionButton } from './MotionPrimitives';

export function ContactView() {
  const { currentUser, sendContactMessage } = useMarketplace();
  const [name, setName] = useState(currentUser?.name ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [subject, setSubject] = useState('Atendimento ao Cliente');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSent(false);
    if (!name.trim() || !email.trim() || !email.includes('@') || !message.trim()) {
      setError('Preencha nome, e-mail válido e sua mensagem.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await sendContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject,
        message: message.trim(),
      });
      if (!res.ok) {
        setError(res.error ?? 'Não foi possível enviar sua mensagem.');
      } else {
        setSent(true);
        setMessage('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-white pb-16">
      <div className="max-w-[1170px] mx-auto px-4 pt-6 space-y-8">
        <div className="border-b border-[#EAEAEA] pb-4">
          <h1 className="font-condensed text-[30px] font-bold uppercase text-[#0A3768]">
            Contacto Cellbox
          </h1>
          <p className="text-xs text-[#777777] mt-1">
            Entre em contacto com a nossa equipa em Maputo para suporte a pedidos, garantia ou
            parcerias comerciais.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Direct Channels */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#F8FAFC] border border-[#EAEAEA] rounded-[3px] p-5 flex items-start gap-3.5">
              <span className="w-9 h-9 rounded-[3px] bg-[#0475EE] text-white flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-xs font-bold uppercase text-[#0A3768]">Sede Maputo</h2>
                <p className="text-sm text-[#555555] mt-1">
                  Av. 25 de Setembro, 1374 — Maputo, Moçambique
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#EAEAEA] rounded-[3px] p-5 flex items-start gap-3.5">
              <span className="w-9 h-9 rounded-[3px] bg-[#18A3DE] text-white flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-xs font-bold uppercase text-[#0A3768]">Telefone e WhatsApp</h2>
                <p className="text-sm font-mono text-[#555555] mt-1">+258 84 400 2026</p>
                <p className="text-sm font-mono text-[#555555]">+258 82 987 4321</p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#EAEAEA] rounded-[3px] p-5 flex items-start gap-3.5">
              <span className="w-9 h-9 rounded-[3px] bg-[#0A3768] text-white flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-xs font-bold uppercase text-[#0A3768]">E-mail</h2>
                <p className="text-sm text-[#555555] mt-1">suporte@cellbox.co.mz</p>
                <p className="text-sm text-[#555555]">parceiros@cellbox.co.mz</p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#EAEAEA] rounded-[3px] p-5 flex items-start gap-3.5">
              <span className="w-9 h-9 rounded-[3px] bg-[#18A3DE] text-white flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-xs font-bold uppercase text-[#0A3768]">Horário de Atendimento</h2>
                <p className="text-sm text-[#555555] mt-1">Segunda a Sexta: 08h00 – 18h00</p>
                <p className="text-sm text-[#555555]">Sábado: 09h00 – 13h00</p>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-7 bg-white border border-[#EAEAEA] rounded-[3px] p-6 sm:p-8 space-y-4"
          >
            <h2 className="font-condensed text-xl font-bold uppercase text-[#0A3768]">
              Envie uma Mensagem
            </h2>

            {error && (
              <div
                role="alert"
                className="p-3 rounded-[2px] bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700"
              >
                {error}
              </div>
            )}

            {sent && (
              <div
                role="status"
                className="p-3 rounded-[2px] bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Mensagem recebida! Responderemos para o seu e-mail em até 24 horas úteis.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className="block text-xs font-bold text-[#444444] mb-1">
                  Nome *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-xs font-bold text-[#444444] mb-1">
                  E-mail *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.co.mz"
                  className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className="block text-xs font-bold text-[#444444] mb-1">
                Assunto
              </label>
              <select
                id="contact-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm bg-white focus:outline-none focus:border-[#0475EE]"
              >
                <option value="Atendimento ao Cliente">Atendimento ao Cliente</option>
                <option value="Suporte a Pedidos e Entregas">Suporte a Pedidos e Entregas</option>
                <option value="Garantia e Devoluções">Garantia e Devoluções</option>
                <option value="Quero Vender na Cellbox">Quero Vender na Cellbox</option>
              </select>
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs font-bold text-[#444444] mb-1">
                Mensagem *
              </label>
              <textarea
                id="contact-message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva como podemos ajudar..."
                className="w-full p-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
              />
            </div>

            <MotionButton
              type="submit"
              disabled={submitting}
              className="h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Enviando...' : 'Enviar Mensagem'}
            </MotionButton>
          </form>
        </div>
      </div>
    </main>
  );
}
