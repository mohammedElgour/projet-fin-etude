import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Globe, MessageCircle, ExternalLink, Mail } from 'lucide-react';

const footerLinks = {
    Produit: ['Fonctionnalites', 'Tarifs', 'FAQ', 'Roadmap'],
    Ressources: ['Blog', 'Guides', 'Webinaires', 'Communaute'],
    Legale: ['Confidentialite', 'Conditions', 'Cookies'],
};

export default function Footer() {
    return (
        <footer className="relative bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
                    <div className="lg:col-span-2">
                        <a href="/#hero" className="flex items-center gap-2 mb-6">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
                                <Compass className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">
                                MyWay<span className="text-primary-500">.</span>
                            </span>
                        </a>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm mb-8">
                            Plateforme d'orientation personnalisee qui vous accompagne dans la decouverte de vos passions et la construction de votre projet professionnel.
                        </p>
                        <div className="flex items-center gap-3">
                            {[Globe, MessageCircle, ExternalLink, Mail].map((Icon, i) => (
                                <motion.a
                                    key={i}
                                    href="/#"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary-500 hover:border-primary-200 dark:hover:border-primary-500/30 transition-colors"
                                >
                                    <Icon className="w-4 h-4" />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">{title}</h4>
                            <ul className="space-y-3">
                                {links.map((link) => (
                                    <li key={link}>
                                        <a
                                            href="/#"
                                            className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                        >
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-16 pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                        &copy; {new Date().getFullYear()} MyWay. Tous droits reserves.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="/#" className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            Confidentialite
                        </a>
                        <a href="/#" className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            Conditions
                        </a>
                        <a href="/#" className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            Contact
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}