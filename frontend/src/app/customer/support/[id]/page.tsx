"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ChevronLeft, Send, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { supportApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatDate, formatDateTime, getApiError } from "@/lib/utils";

export default function CustomerTicketDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = Number(params.id);
  const { isAuthenticated, user } = useAuthStore();
  const [ticket, setTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchDetails();
  }, [isAuthenticated, ticketId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const { data } = await supportApi.getTicketDetails(ticketId);
      setTicket(data);
      scrollToBottom();
    } catch {
      toast.error("Failed to load ticket details");
      router.push("/customer/support");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await supportApi.replyToTicket(ticketId, {
        message: replyMessage.trim(),
      });
      setTicket(data);
      setReplyMessage("");
      toast.success("Reply sent!");
      scrollToBottom();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return "bg-[#EFEBE3] text-[#2E7D32] border-[#E2DAC8]";
      case "in_progress":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "resolved":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const categoryLabels: Record<string, string> = {
    order_help: "Order Help",
    payment: "Payment Issue",
    refund: "Return & Refund",
    general_inquiry: "General Inquiry",
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center bg-[#F8F5F0]">
        <Loader2 className="animate-spin text-[#0D0D0D]" size={32} />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#1A1A1A] font-garamond">

      {/* ── Mobile Top Bar ── */}
      <div className="md:hidden sticky top-0 z-40 bg-[#F8F5F0] border-b border-[#E2DAC8] shadow-xs">
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#EFEBE3] transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={22} className="text-[#1A1A1A]" />
          </button>
          <h1 className="font-cormorant text-[20px] font-bold tracking-wide text-[#1A1A1A]">
            Ticket #{ticket.id}
          </h1>
          <div className="w-9 h-9 flex items-center justify-center text-xs font-bold text-[#0D0D0D]">
            {ticket.status}
          </div>
        </div>
      </div>

      {/* ── Desktop Header ── */}
      <div className="hidden md:block max-w-4xl mx-auto px-6 pt-6 pb-2">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#0D0D0D] hover:underline mb-3"
        >
          <ChevronLeft size={16} /> Back to Support Desk
        </button>
        <div className="flex justify-between items-start border-b border-[#EFEBE3] pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-widest text-[#0D0D0D] bg-[#EFEBE3] border border-[#E2DAC8] px-2.5 py-1 rounded-md uppercase inline-block">
                {categoryLabels[ticket.category] || ticket.category}
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border rounded-md ${getStatusBadge(ticket.status)}`}>
                {ticket.status.replace(/_/g, " ")}
              </span>
            </div>
            <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1A1A1A]">{ticket.subject}</h1>
            <p className="text-xs text-[#808080] mt-0.5">Created on {formatDate(ticket.created_at)}</p>
          </div>
        </div>
      </div>

      {/* ── Chat Messages Container ── */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4">
        <div className="bg-white border border-[#E2DAC8] rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
          <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A] border-b border-[#EFEBE3] pb-2">
            Conversation Thread
          </h2>

          <div className="space-y-4 max-h-[500px] overflow-y-auto p-1 scrollbar-none">
            {ticket.messages?.map((msg: any) => {
              const isMe = msg.sender_id === user?.id || msg.sender_role === "customer";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 space-y-1 ${
                      isMe
                        ? "bg-[#0D0D0D] text-white rounded-br-none"
                        : "bg-[#F8F5F0] border border-[#E2DAC8] text-[#1A1A1A] rounded-bl-none"
                    }`}
                  >
                    <p className="text-xs font-bold text-wood-300">
                      {msg.sender_name || (isMe ? "You" : "Support Agent")}
                    </p>
                    <p className="text-xs leading-relaxed font-garamond">{msg.message}</p>
                    <p className={`text-[10px] text-right mt-1 ${isMe ? "text-wood-200/70" : "text-[#808080]"}`}>
                      {formatDateTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Reply Form */}
          {ticket.status !== "resolved" && (
            <form onSubmit={handleSendReply} className="pt-3 border-t border-[#EFEBE3] flex gap-2">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 text-xs font-garamond text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
                required
              />
              <button
                type="submit"
                disabled={submitting || !replyMessage.trim()}
                className="bg-[#0D0D0D] hover:bg-[#333333] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span>Send</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
