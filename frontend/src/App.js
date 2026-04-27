import React from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Hero from './components/sections/Hero';
import Features from './components/sections/Features';
import HowItWorks from './components/sections/HowItWorks';
import CareerExploration from './components/sections/CareerExploration';
import PersonalizedExperience from './components/sections/PersonalizedExperience';
import Testimonials from './components/sections/Testimonials';
import CTASection from './components/sections/CTASection';

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CareerExploration />
        <PersonalizedExperience />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

export default App;

