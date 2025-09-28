import React from 'react';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  text: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, text }) => (
  <div className="flex flex-col items-center p-6 bg-gray-100 rounded-xl shadow-md">
    <div className="text-4xl mb-2">{icon}</div>
    <h3 className="text-lg font-semibold mb-1 text-center">{title}</h3>
    <p className="text-gray-600 text-center">{text}</p>
  </div>
);

export default Feature;
