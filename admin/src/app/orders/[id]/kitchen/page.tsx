"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOrder, listBranches } from "@/lib/admin-api";
import { formatKarachi } from "@/lib/dates";
import { TYPE_LABELS } from "@/lib/orders";
import { Button } from "@/components/ui/button";

export default function KitchenTicketPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const orderQuery = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
  });
  const branchesQuery = useQuery({
    queryKey: ["branches"],
    queryFn: listBranches,
  });

  const order = orderQuery.data;
  const branch = branchesQuery.data?.find((b) => b.id === order?.branchId);

  if (orderQuery.isLoading) {
    return <p className="p-8 text-sm">Loading kitchen ticket…</p>;
  }
  if (!order) {
    return <p className="p-8 text-sm text-rose-700">Order not found.</p>;
  }

  return (
    <div className="min-h-screen bg-white p-4 text-black">
      <div className="no-print mb-4 flex gap-2">
        <Button onClick={() => window.print()}>Print kitchen ticket</Button>
        <Button variant="outline" onClick={() => window.close()}>
          Close
        </Button>
      </div>

      <article className="print-sheet mx-auto max-w-sm border-2 border-black p-4 font-mono text-sm">
        <header className="border-b-2 border-black pb-2 text-center">
          <p className="text-lg font-bold tracking-wide">KITCHEN</p>
          <p className="text-2xl font-black">{order.orderNumber}</p>
          <p className="mt-1 font-bold uppercase">{TYPE_LABELS[order.type]}</p>
          {branch ? <p>{branch.name}</p> : null}
          <p>{formatKarachi(order.createdAt)}</p>
        </header>

        <div className="mt-3 border-b border-dashed border-black pb-2">
          <p className="font-bold">{order.customer.name}</p>
          <p>{order.customer.phone}</p>
        </div>

        <ul className="mt-3 space-y-3">
          {order.items.map((item, i) => (
            <li key={item.id ?? i} className="border-b border-dashed border-black pb-2">
              <p className="text-base font-black">
                {item.quantity} × {item.productName}
              </p>
              {item.variantName ? <p>Size/Var: {item.variantName}</p> : null}
              {item.modifiers.length > 0 ? (
                <p>+ {item.modifiers.map((m) => m.name).join(", ")}</p>
              ) : null}
              {item.notes ? <p className="font-bold">** {item.notes}</p> : null}
            </li>
          ))}
        </ul>

        {order.notes ? (
          <p className="mt-3 border-2 border-black p-2 font-bold">ORDER NOTE: {order.notes}</p>
        ) : null}

        <p className="mt-4 text-center text-xs">— end of ticket —</p>
      </article>
    </div>
  );
}
