/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Upload, 
  Sparkles, 
  Layout, 
  Instagram, 
  Facebook, 
  Smartphone, 
  CheckCircle2, 
  Loader2, 
  Download,
  Plus,
  ArrowRight,
  Image as ImageIcon,
  DollarSign,
  Type,
  FileText,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---

interface FlyerData {
  productName: string;
  productDescription: string;
  price: string;
  platform: 'instagram_post' | 'instagram_story' | 'facebook_post' | 'digital_ad';
  image: string | null;
  country: string;
  language: string;
}

interface GeneratedFlyer {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

// --- Constants ---

const PLATFORMS = [
  { id: 'instagram_post', label: 'Instagram Post (1:1)', icon: Instagram, ratio: '1:1' },
  { id: 'instagram_story', label: 'Instagram Story (9:16)', icon: Smartphone, ratio: '9:16' },
  { id: 'facebook_post', label: 'Facebook Post (4:3)', icon: Facebook, ratio: '4:3' },
  { id: 'digital_ad', label: 'Digital Ad (16:9)', icon: Layout, ratio: '16:9' },
];

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'zh', label: '中文 (Chinese)' },
  { code: 'ko', label: '한국어 (Korean)' },
  { code: 'ar', label: 'العربية (Arabic)' },
];

const COUNTRIES = [
  'Colombia', 'México', 'España', 'Argentina', 'Chile', 'Perú', 'Estados Unidos', 
  'Brasil', 'Reino Unido', 'Canadá', 'Australia', 'Francia', 'Alemania', 'Italia', 
  'Japón', 'China', 'Corea del Sur', 'Emiratos Árabes Unidos'
];

// --- App Component ---

export default function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [flyerData, setFlyerData] = useState<FlyerData>({
    productName: '',
    productDescription: '',
    price: '',
    platform: 'instagram_post',
    image: null,
    country: 'Colombia',
    language: 'Español',
  });
  const [generatedFlyers, setGeneratedFlyers] = useState<GeneratedFlyer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showKeySelection, setShowKeySelection] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setShowKeySelection(true);
        }
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setShowKeySelection(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFlyerData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateFlyer = async () => {
    if (!flyerData.image) return;
    
    setLoading(true);
    setError(null);

    try {
      // Use process.env.API_KEY if available (user-selected key), fallback to GEMINI_API_KEY
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setShowKeySelection(true);
        throw new Error("Se requiere una API Key para generar imágenes. Por favor, selecciona una.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Determine aspect ratio for the model
      let aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1";
      if (flyerData.platform === 'instagram_story') aspectRatio = "9:16";
      if (flyerData.platform === 'facebook_post') aspectRatio = "4:3";
      if (flyerData.platform === 'digital_ad') aspectRatio = "16:9";

      const base64Data = flyerData.image.split(',')[1];
      const mimeType = flyerData.image.split(';')[0].split(':')[1];

      const prompt = `
        Create a professional, modern, and high-end advertising flyer for this product.
        
        TARGET LOCALIZATION:
        - Language: ${flyerData.language}
        - Country: ${flyerData.country}
        
        PRODUCT DETAILS:
        - Product Name: ${flyerData.productName}
        - Description: ${flyerData.productDescription}
        - Price: ${flyerData.price}
        - Platform: ${flyerData.platform}

        CRITICAL TEXT RENDERING RULES:
        1. THE TEXT MUST BE CRYSTAL CLEAR, LEGIBLE, AND PERFECTLY RENDERED.
        2. USE THE EXACT SPELLING AND CASING: "${flyerData.productName}", "${flyerData.productDescription}", "${flyerData.price}".
        3. DO NOT ADD, REMOVE, OR CHANGE ANY LETTERS OR CHARACTERS.
        4. ENSURE PERFECT ACCENTUATION (TILDES) AND GRAMMAR FOR THE ${flyerData.language.toUpperCase()} LANGUAGE IN ${flyerData.country.toUpperCase()}.
        5. IF YOU CANNOT RENDER THE TEXT WITH 100% ACCURACY, DO NOT RENDER IT AT ALL.
        6. THE PRICE "${flyerData.price}" MUST BE THE MOST VISIBLE ELEMENT, BOLD AND LARGE.

        DESIGN REQUIREMENTS:
        1. Keep the product from the image 100% identical and central.
        2. Create a majestic background with vibrant colors (e.g., deep purples, electric blues, or sunset oranges) that complement the product.
        3. Use modern graphic design techniques: abstract shapes, glowing icons related to the product's solution, and high-end shadows.
        4. LARGE, IMPACTFUL TITLES with professional typography and effects.
        5. The price must be extremely impactful, Walmart-style (bold, large, yellow/red highlight) to grab immediate attention.
        6. Include short, punchy marketing text describing the value proposition based on the description, written in ${flyerData.language}.
        7. The overall look should be premium, suitable for a high-end digital campaign.
        8. Composition should be optimized for a ${aspectRatio} aspect ratio.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: "1K"
          }
        }
      });

      let imageUrl = '';
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        const newFlyer: GeneratedFlyer = {
          id: Math.random().toString(36).substr(2, 9),
          url: imageUrl,
          prompt: prompt,
          timestamp: Date.now()
        };
        setGeneratedFlyers(prev => [newFlyer, ...prev]);
        setStep(3);
      } else {
        throw new Error("No se pudo generar la imagen. Intenta de nuevo.");
      }

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "Ocurrió un error al generar el flyer.";
      
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("PERMISSION_DENIED")) {
        setShowKeySelection(true);
        setError("Error de permisos. Por favor, asegúrate de haber seleccionado una API Key válida con facturación habilitada.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      {/* Key Selection Overlay */}
      <AnimatePresence>
        {showKeySelection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Configuración Requerida</h2>
              <p className="text-zinc-400 mb-8">
                Para generar imágenes de alta calidad con Gemini 3.1, necesitas seleccionar una API Key de un proyecto de Google Cloud con facturación habilitada.
              </p>
              <div className="space-y-4">
                <button
                  onClick={handleSelectKey}
                  className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                >
                  Seleccionar API Key
                  <ArrowRight className="w-5 h-5" />
                </button>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-sm text-zinc-500 hover:text-zinc-300 underline"
                >
                  Más información sobre facturación
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="text-black w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">Flyer<span className="text-emerald-500">AI</span> Pro</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#" className="hover:text-white transition-colors">Galería</a>
            <a href="#" className="hover:text-white transition-colors">Plantillas</a>
            <a href="#" className="hover:text-white transition-colors">Precios</a>
          </div>
          <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-emerald-400 transition-all active:scale-95">
            Suscribirse
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  step >= s ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-white/20 text-white/40'
                }`}>
                  {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${step >= s ? 'text-emerald-500' : 'text-white/20'}`}>
                  {s === 1 ? 'Producto' : s === 2 ? 'Detalles' : 'Resultado'}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-emerald-500"
              initial={{ width: '0%' }}
              animate={{ width: `${((step - 1) / 2) * 100}%` }}
              transition={{ duration: 0.5, ease: "circOut" }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                  SUBE TU <span className="text-emerald-500 italic">PRODUCTO</span>
                </h1>
                <p className="text-white/60 text-lg max-w-2xl mx-auto">
                  Comienza cargando una foto clara de tu producto. Nuestra IA se encargará de crear el escenario perfecto.
                </p>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`group relative border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer overflow-hidden ${
                  flyerData.image ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-emerald-500/50 hover:bg-white/5'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                {flyerData.image ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
                    <img src={flyerData.image} alt="Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-bold flex items-center gap-2">
                        <Upload className="w-5 h-5" /> Cambiar Imagen
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6 py-12">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">Haz clic o arrastra tu imagen aquí</p>
                      <p className="text-white/40">PNG, JPG o WEBP (Máx. 10MB)</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button 
                  disabled={!flyerData.image}
                  onClick={nextStep}
                  className="group bg-emerald-500 text-black px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-400 transition-all active:scale-95"
                >
                  Continuar <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="text-center space-y-4">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                  DEFINE LA <span className="text-emerald-500 italic">OFERTA</span>
                </h2>
                <p className="text-white/60 text-lg">Cuéntanos más sobre el producto para crear textos persuasivos.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <Type className="w-4 h-4" /> Nombre del Producto
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej: Auriculares Pro X-9"
                      value={flyerData.productName}
                      onChange={(e) => setFlyerData({...flyerData, productName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-colors text-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Precio
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ej: $49.99"
                        value={flyerData.price}
                        onChange={(e) => setFlyerData({...flyerData, price: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-colors text-lg font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        Idioma / País
                      </label>
                      <div className="flex gap-2">
                        <div className="relative w-1/2">
                          <select 
                            value={flyerData.language}
                            onChange={(e) => setFlyerData({...flyerData, language: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus:outline-none focus:border-emerald-500 transition-colors text-sm appearance-none cursor-pointer pr-10"
                          >
                            {LANGUAGES.map(lang => (
                              <option key={lang.code} value={lang.label} className="bg-[#050505]">{lang.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                        </div>
                        <div className="relative w-1/2">
                          <select 
                            value={flyerData.country}
                            onChange={(e) => setFlyerData({...flyerData, country: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus:outline-none focus:border-emerald-500 transition-colors text-sm appearance-none cursor-pointer pr-10"
                          >
                            {COUNTRIES.map(country => (
                              <option key={country} value={country} className="bg-[#050505]">{country}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Descripción / Valor
                    </label>
                    <textarea 
                      placeholder="Ej: Sonido envolvente y batería de 40 horas..."
                      rows={4}
                      value={flyerData.productDescription}
                      onChange={(e) => setFlyerData({...flyerData, productDescription: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-colors text-lg resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Layout className="w-4 h-4" /> Formato de Publicación
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setFlyerData({...flyerData, platform: p.id as any})}
                        className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 text-center ${
                          flyerData.platform === p.id 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : 'border-white/5 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <p.icon className={`w-8 h-8 ${flyerData.platform === p.id ? 'text-emerald-500' : 'text-white/40'}`} />
                        <div>
                          <p className="font-bold text-sm">{p.label}</p>
                          <p className="text-[10px] opacity-40 uppercase tracking-tighter">{p.ratio}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <button 
                  onClick={prevStep}
                  className="px-8 py-4 rounded-2xl font-bold text-white/60 hover:text-white transition-colors"
                >
                  Atrás
                </button>
                <button 
                  disabled={!flyerData.productName || !flyerData.price || loading}
                  onClick={generateFlyer}
                  className="group bg-emerald-500 text-black px-12 py-4 rounded-2xl font-black text-xl flex items-center gap-3 disabled:opacity-50 hover:bg-emerald-400 transition-all active:scale-95 shadow-2xl shadow-emerald-500/20"
                >
                  {loading ? (
                    <>Generando... <Loader2 className="w-6 h-6 animate-spin" /></>
                  ) : (
                    <>Crear Flyer <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                  TU <span className="text-emerald-500 italic">OBRA MAESTRA</span>
                </h2>
                <p className="text-white/60 text-lg">Aquí tienes tu flyer publicitario listo para brillar.</p>
              </div>

              {generatedFlyers.length > 0 && (
                <div className="grid lg:grid-cols-12 gap-12 items-start">
                  {/* Main Preview */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="relative group rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.15)] bg-white/5 border border-white/10">
                      <img 
                        src={generatedFlyers[0].url} 
                        alt="Generated Flyer" 
                        className="w-full h-auto"
                      />
                      <div className="absolute top-6 right-6 flex gap-3">
                        <button className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all">
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => setStep(2)}
                        className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" /> Generar Otra Versión
                      </button>
                      <button 
                        className="flex-1 bg-emerald-500 text-black px-8 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 hover:bg-emerald-400"
                      >
                        Descargar Todo <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Sidebar / History */}
                  <div className="lg:col-span-5 space-y-8">
                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6">
                      <h3 className="text-xl font-black flex items-center gap-2">
                        <Layout className="w-5 h-5 text-emerald-500" /> Variaciones
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {generatedFlyers.map((flyer) => (
                          <div 
                            key={flyer.id} 
                            className="aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/50 cursor-pointer transition-all group relative"
                          >
                            <img src={flyer.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Download className="w-6 h-6" />
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => setStep(2)}
                          className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 text-white/40 hover:text-emerald-500 transition-all"
                        >
                          <Plus className="w-8 h-8" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Nueva</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] p-8 space-y-4">
                      <h4 className="font-black text-emerald-500 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Tip Pro
                      </h4>
                      <p className="text-sm text-white/70 leading-relaxed">
                        ¿Quieres un carrusel? Genera 3 o 4 variaciones con diferentes ángulos de texto para mantener a tu audiencia enganchada.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-center font-bold"
          >
            {error}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <Sparkles className="text-emerald-500 w-5 h-5" />
            <span className="font-bold tracking-tight">FlyerAI Pro</span>
          </div>
          <p className="text-white/40 text-sm">© 2026 FlyerAI Pro. Potenciado por Gemini 2.5 Flash.</p>
          <div className="flex gap-6 text-white/40 text-sm">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
