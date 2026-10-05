"use client";

import { useEffect, useState, useRef } from "react";
import { X, Send, User, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice, formatDate } from "@/lib/utils";

interface Conversation {
    _id: string;
    status: string;
}

interface Message {
    _id: string;
    sender_type: string;
    content: string;
    is_offer: boolean;
    offer_id?: {
        _id: string;
        proposed_price: number;
        status: string;
        merchant_id: string;
        customer_id: string;
    };
    created_at: string;
}

interface Props {
    productId: number;
    productName: string;
    productImage: string;
    listedPrice: number;
    onClose: () => void;
}

export default function BargainPanel({ productId, productName, productImage, listedPrice, onClose }: Props) {
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState("");
    const [offerPrice, setOfferPrice] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isOfferMode, setIsOfferMode] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async (convId: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/conversations/${convId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!res.ok) throw new Error("Failed to fetch messages");
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            toast.error("Failed to load conversation history");
        }
    };

    const initConversation = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/conversations/init`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ product_id: productId })
            });
            if (!res.ok) throw new Error("Failed to initialize conversation");
            const data = await res.json();
            setConversation(data);
            await fetchMessages(data._id);
        } catch (err) {
            toast.error("Failed to start negotiation");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initConversation();
        const interval = setInterval(() => {
            if (conversation) fetchMessages(conversation._id);
        }, 10000); // Polling every 10s for simplicity
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!conversation) return;
        if (!inputText.trim() && !offerPrice) return;
        if (isOfferMode && !offerPrice) {
            toast.error("Please enter an offer price");
            return;
        }

        setIsSending(true);
        try {
            const payload: any = { content: inputText };
            if (isOfferMode && offerPrice) {
                payload.offer_price = Number(offerPrice);
            }

            const res = await fetch(`http://localhost:5000/api/conversations/${conversation._id}/messages`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to send message");

            setInputText("");
            setOfferPrice("");
            setIsOfferMode(false);
            await fetchMessages(conversation._id);
        } catch (err) {
            toast.error("Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    const acceptOffer = async (offerId: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/conversations/offers/${offerId}/accept`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || "Failed to accept offer");
            }
            toast.success("Offer accepted!");
            await fetchMessages(conversation!._id);
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 z-[100] w-full sm:w-[450px] bg-white shadow-2xl flex flex-col animate-slide-in font-inter text-wood-900 border-l border-wood-200">
            {/* Header */}
            <div className="p-4 border-b border-wood-200 flex items-center justify-between bg-wood-50">
                <div>
                    <h2 className="font-playfair font-semibold text-xl">Negotiate Price</h2>
                    <p className="text-xs text-wood-500">Live with Artisan/Merchant</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-wood-200 rounded-full transition-colors">
                    <X size={20} className="text-wood-600" />
                </button>
            </div>

            {/* Product Summary */}
            <div className="p-4 border-b border-wood-100 flex gap-4 items-center bg-white">
                <img src={productImage} alt="Product" className="w-14 h-14 object-cover rounded-md border border-wood-200" />
                <div>
                    <h3 className="font-semibold text-sm line-clamp-1">{productName}</h3>
                    <p className="text-xs text-wood-500 mt-0.5">Listed Price: <strong className="text-wood-900">{formatPrice(listedPrice)}</strong></p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-wood-50/50">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="animate-spin text-wood-400" size={24} />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-10 opacity-70">
                        <p className="text-sm font-medium">Start the conversation</p>
                        <p className="text-xs mt-1 text-wood-500">Ask a question or make an offer</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_type === "CUSTOMER";
                        const isSystem = msg.sender_type === "SYSTEM";

                        if (isSystem) {
                            return (
                                <div key={msg._id} className="text-center text-xs text-wood-500 my-4 bg-white py-1 px-4 rounded-full border border-wood-200 inline-block mx-auto max-w-xs self-center">
                                    {msg.content}
                                </div>
                            );
                        }

                        return (
                            <div key={msg._id} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end ml-auto items-end' : 'self-start mr-auto items-start'}`}>
                                <div className={`p-3 rounded-2xl ${isMe ? 'bg-wood-800 text-white rounded-tr-sm' : 'bg-white border border-wood-200 text-wood-900 rounded-tl-sm shadow-sm'}`}>
                                    {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}

                                    {msg.is_offer && msg.offer_id && (
                                        <div className={`mt-2 p-3 rounded-xl border ${isMe ? 'bg-wood-900 border-wood-700' : 'bg-green-50 border-green-200'}`}>
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-wide opacity-80">{isMe ? 'Your Offer' : 'Merchant Counteroffer'}</p>
                                                    <p className={`text-lg font-bold font-outfit ${isMe ? 'text-gold-200' : 'text-green-800'}`}>
                                                        {formatPrice(msg.offer_id.proposed_price)}
                                                    </p>
                                                </div>
                                                {msg.offer_id.status === 'PENDING' || msg.offer_id.status === 'COUNTERED' ? (
                                                    !isMe ? (
                                                        <button
                                                            onClick={() => acceptOffer(msg.offer_id!._id)}
                                                            className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <CheckCircle2 size={14} /> Accept
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] bg-wood-700 px-2 py-1 rounded">Pending</span>
                                                    )
                                                ) : (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">{msg.offer_id.status}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-wood-400 mt-1 px-1">{formatDate(msg.created_at)}</span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-wood-200">
                {isOfferMode && (
                    <div className="mb-3 p-3 bg-wood-50 rounded-xl border border-wood-200 flex items-center gap-2">
                        <span className="font-semibold text-sm">₹</span>
                        <input
                            type="number"
                            placeholder="Enter your offer amount..."
                            value={offerPrice}
                            onChange={e => setOfferPrice(e.target.value)}
                            className="flex-1 bg-transparent text-sm focus:outline-none"
                            autoFocus
                        />
                        <button type="button" onClick={() => setIsOfferMode(false)} className="text-xs text-wood-500 hover:text-wood-900 underline">Cancel</button>
                    </div>
                )}
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    {!isOfferMode && (
                        <button type="button" onClick={() => setIsOfferMode(true)} className="bg-wood-100 hover:bg-wood-200 text-wood-800 text-xs font-semibold px-4 py-3 rounded-full transition-colors whitespace-nowrap">
                            Make Offer
                        </button>
                    )}
                    <input
                        type="text"
                        placeholder={isOfferMode ? "Add an optional message..." : "Type your message..."}
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        className="flex-1 bg-wood-50 border border-wood-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-wood-500"
                    />
                    <button
                        type="submit"
                        disabled={isSending || (!inputText.trim() && !isOfferMode)}
                        className="bg-wood-900 hover:bg-wood-900 text-white p-3 rounded-full transition-colors disabled:opacity-50"
                    >
                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
