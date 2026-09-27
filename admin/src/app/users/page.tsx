"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { createUser, listBranches, listUsers, updateUser } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { roleLabel } from "@/lib/roles";
import { useAuth } from "@/hooks/useAuth";
import type { AdminRole, AdminUser } from "@/types";
import { ADMIN_ROLES } from "@heybrew/shared";
import { Badge, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/field";
import { formatKarachi } from "@/lib/dates";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().optional(),
  role: z.enum(["owner", "manager", "staff"]),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function UsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const isOwner = user?.role === "owner";

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    enabled: isOwner,
  });

  useQuery({ queryKey: ["branches"], queryFn: listBranches, enabled: isOwner });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "staff",
      isActive: true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (editing) {
        const body: Parameters<typeof updateUser>[1] = {
          name: values.name,
          email: values.email,
          role: values.role,
          isActive: values.isActive,
        };
        if (values.password && values.password.length >= 10) {
          body.password = values.password;
        }
        return updateUser(editing.id, body);
      }
      if (!values.password || values.password.length < 10) {
        throw new ApiError(400, "VALIDATION_ERROR", "Password must be at least 10 characters");
      }
      return createUser({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      });
    },
    onSuccess: () => {
      toast.success(editing ? "User updated" : "User created");
      setShowForm(false);
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Save failed"),
  });

  if (!isOwner) {
    return (
      <EmptyState
        title="Owner only"
        description="Admin user management is restricted to the owner role. The server also enforces this."
      />
    );
  }

  const openCreate = () => {
    setEditing(null);
    form.reset({
      name: "",
      email: "",
      password: "",
      role: "staff",
      isActive: true,
    });
    setShowForm(true);
  };

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    form.reset({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      isActive: u.isActive,
    });
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader
        title="Admin users"
        description="Owner-only. Roles: owner · manager · staff. Nav items are hidden client-side; API enforces permissions."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add user
          </Button>
        }
      />

      {showForm ? (
        <form
          className="mb-6 rounded-xl border border-espresso/10 bg-cream-soft p-5 shadow-soft"
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
        >
          <h2 className="font-display text-lg">
            {editing ? "Edit user" : "New user"}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input {...form.register("name")} />
              <FieldError message={form.formState.errors.name?.message} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} />
              <FieldError message={form.formState.errors.email?.message} />
            </div>
            <div>
              <Label>
                Password {editing ? "(leave blank to keep)" : "(min 10 chars)"}
              </Label>
              <Input type="password" autoComplete="new-password" {...form.register("password")} />
            </div>
            <div>
              <Label>Role</Label>
              <Select {...form.register("role")}>
                {ADMIN_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r as AdminRole)}
                  </option>
                ))}
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <input type="checkbox" {...form.register("isActive")} /> Active
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" loading={saveMutation.isPending}>
              Save
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {usersQuery.isError ? (
        <EmptyState title="Could not load users" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-espresso/10 bg-cream-soft shadow-soft">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-cream-deep/60 text-xs uppercase text-espresso/55">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/8">
              {(usersQuery.data ?? []).map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{roleLabel(u.role)}</td>
                  <td className="px-4 py-3 text-espresso/60">
                    {u.lastLoginAt ? formatKarachi(u.lastLoginAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        u.isActive
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-rose-100 text-rose-800"
                      }
                    >
                      {u.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
