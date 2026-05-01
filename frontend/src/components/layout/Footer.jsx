import React from 'react';
import {
  CircleUserRound,
  Compass,
  Globe,
  Mail,
  MapPin,
  Phone,
  Share2,
} from 'lucide-react';

const columns = [
  {
    title: 'ISTA Notes',
    links: ['A propos', 'Contact', 'Mentions legales'],
  },
  {
    title: 'Filieres',
    links: ['Developpement Digital', 'Gestion', 'Reseaux'],
  },
  {
    title: 'Liens utiles',
    links: ['OFPPT', 'ISTA', 'Support'],
  },
];

const socialLinks = [Globe, Share2, CircleUserRound];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-sky-500/20">
                <Compass className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">ISTA Notes</p>
                <p className="text-sm text-slate-400">Plateforme de suivi et de validation academique</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              Une interface moderne pour accompagner les etablissements ISTA et soutenir la reussite
              des stagiaires dans l esprit OFPPT.
            </p>

            <div className="mt-6 flex gap-3">
              {socialLinks.map((Icon, index) => (
                <a
                  key={index}
                  href="#hero"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-sky-400/40 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">{column.title}</h3>
              <ul className="mt-5 space-y-3 text-sm text-slate-400">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#hero" className="transition-colors hover:text-sky-300">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">Contact</h3>
            <ul className="mt-5 space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-sky-300" />
                <span>contact@istanotes.ma</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-sky-300" />
                <span>+212 5 22 00 00 00</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-sky-300" />
                <span>Casablanca, Maroc</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 ISTA Notes. Tous droits reserves.</p>
          <p>Comptes demo: admin@ista.test, prof@ista.test, sara@ista.test / password123</p>
        </div>
      </div>
    </footer>
  );
}
