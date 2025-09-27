'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { HomeBookingForm } from './HomeBookingForm';
import { Calendar, Clock, Shield, Star, Phone, Mail, MapPin } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface HomepageProps {
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
  onBookingSuccess?: () => void;
}

export function Homepage({ onLoginClick, onSignUpClick, onBookingSuccess }: HomepageProps) {
  const router = useRouter();

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      router.push('/login');
    }
  };

  const handleSignUpClick = () => {
    if (onSignUpClick) {
      onSignUpClick();
    } else {
      router.push('/signup');
    }
  };

  const scrollToBooking = () => {
    const bookingSection = document.getElementById('booking-section');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">Go-Goyagoy</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleLoginClick}>
                Sign In
              </Button>
              <Button onClick={handleSignUpClick}>
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                Your Smile is Our
                <span className="text-blue-600"> Priority</span>
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Modern dental care with a personal touch. Book your appointment today and experience the difference.
              </p>
              <div className="mt-8 flex space-x-4">
                <Button size="lg" onClick={scrollToBooking}>
                  Book Appointment
                </Button>
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Modern dental office"
                className="rounded-lg shadow-xl w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-gray-900">
              Why Choose Go-Goyagoy?
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              We provide comprehensive dental care with state-of-the-art technology
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center">
                <Calendar className="h-12 w-12 text-blue-600" />
              </div>
              <h4 className="mt-4 text-lg font-semibold">Easy Booking</h4>
              <p className="mt-2 text-gray-600">
                Schedule your appointment online 24/7. Your booking is confirmed instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <Shield className="h-12 w-12 text-blue-600" />
              </div>
              <h4 className="mt-4 text-lg font-semibold">Safe & Secure</h4>
              <p className="mt-2 text-gray-600">
                Your health and privacy are our top priorities with the latest safety protocols.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <Star className="h-12 w-12 text-blue-600" />
              </div>
              <h4 className="mt-4 text-lg font-semibold">Expert Care</h4>
              <p className="mt-2 text-gray-600">
                Our experienced dentists provide personalized treatment plans for every patient.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-gray-900">
              Our Services
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              Comprehensive dental care for the whole family
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              'General Dentistry',
              'Cosmetic Dentistry',
              'Orthodontics',
              'Oral Surgery',
              'Preventive Care',
              'Emergency Care'
            ].map((service, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
                <h4 className="text-lg font-semibold text-gray-900">{service}</h4>
                <p className="mt-2 text-gray-600">
                  Professional {service.toLowerCase()} services with the latest techniques and technology.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking-section" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-extrabold text-gray-900">
              Book Your Appointment
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              Fill out the form below and your appointment will be confirmed instantly
            </p>
          </div>

          <div className="flex justify-center">
            <HomeBookingForm 
              isOpen={true} 
              onClose={() => {}} 
              onSuccess={onBookingSuccess || (() => {})} 
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-extrabold text-gray-900">
              Contact Us
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              Get in touch with our friendly team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center">
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="mt-4 font-semibold">Phone</h4>
              <p className="mt-2 text-gray-600">(555) 123-CARE</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="mt-4 font-semibold">Email</h4>
              <p className="mt-2 text-gray-600">info@go-goyagoy.com</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="mt-4 font-semibold">Location</h4>
              <p className="mt-2 text-gray-600">123 Dental Ave<br />Smile City, SC 12345</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h4 className="text-lg font-semibold">Go-Goyagoy</h4>
            <p className="mt-2 text-gray-400">
              © 2024 Go-Goyagoy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}