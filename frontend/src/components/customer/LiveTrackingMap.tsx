"use client";
import {Order} from '@/types';
export default function LiveTrackingMap({order}:{order:Order}){return <section className="p-6 border rounded-xl bg-white space-y-3"><h2 className="text-xl font-bold">Delivery updates</h2><p>Status: {order.status.replaceAll('_',' ')}</p><p>{order.current_location||'The store team has not provided a location update yet.'}</p>{order.tracking_number&&<p>Tracking reference: {order.tracking_number}</p>}<p className="text-sm text-gray-600">Delivery updates are supplied by the store team. Live GPS tracking is not connected.</p></section>;}
