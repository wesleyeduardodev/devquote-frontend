import React from 'react';
import { Linkedin, Github, Instagram, Facebook, Phone, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center space-y-4">
          {/* Nome e título */}
          <div className="text-center">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Desenvolvido por Wesley Eduardo
            </h3>
            <p className="text-gray-600 text-sm mt-1">Desenvolvedor Full Stack</p>
          </div>

          {/* Contato */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
            <a
              href="tel:+5598981650805"
              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>+55 98 98165-0805</span>
            </a>
            <a
              href="mailto:wesleyeduardo.dev@gmail.com"
              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>wesleyeduardo.dev@gmail.com</span>
            </a>
          </div>

          {/* Redes sociais */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.linkedin.com/in/wesley-eduardo-8a1066169/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              title="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/wesleyeduardodev"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              title="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://www.instagram.com/wesleyeduardo.dev?igsh=ano4MTVqN2F6ZWh0&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors"
              title="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://www.facebook.com/wesleyeduardo.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              title="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-100 w-full">
            © 2025 DevQuote. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
