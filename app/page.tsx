"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Item = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  price: number;
  imageUrl?: string;
};

export default function InventoryApp() {
  const [items, setItems] = useState<Item[]>([]);

  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    price: "",
    image: null as File | null,
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  const [fetching, setFetching] = useState(true);

  const fetchItems = async () => {
    try {
      setFetching(true);

      const res = await fetch("/api/inventory");

      if (!res.ok) {
        throw new Error("Failed to fetch inventory");
      }

      const data = await res.json();

      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);


  const handleImageUpload = async (
    file: File
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Image upload failed");
    }

    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const priceNum = Number(form.price);
    const quantityNum = Number(form.quantity);

    if (isNaN(priceNum) || priceNum < 0 || priceNum > 21474836.47) {
      alert("Price must be a valid number between 0 and 21,474,836.47");
      return;
    }

    if (!Number.isInteger(quantityNum) || quantityNum < 0 || quantityNum > 2147483647) {
      alert("Quantity must be a valid integer between 0 and 2,147,483,647");
      return;
    }

    try {
      setLoading(true);

      const isEditing = editingId !== null;
      const currentItem = isEditing ? items.find((item) => item.id === editingId) : null;
      let imageUrl: string | undefined = currentItem?.imageUrl || undefined;

      if (form.image) {
        imageUrl = await handleImageUpload(
          form.image
        );
      }

      const itemData = {
        name: form.name,
        category: form.category,
        quantity: Number(form.quantity),
        price: Math.round(
          Number(form.price) * 100
        ),
        imageUrl,
      };

      const endpoint = isEditing
        ? `/api/inventory/${editingId}`
        : "/api/inventory";

      const method = isEditing
        ? "PUT"
        : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(itemData),
      });

      if (!res.ok) {
        throw new Error("Failed to save item");
      }

      setForm({
        name: "",
        category: "",
        quantity: "",
        price: "",
        image: null,
      });

      setEditingId(null);

      await fetchItems();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Item) => {
    setForm({
      name: item.name,
      category: item.category,
      quantity:
        item.quantity.toString(),
      price: (
        item.price / 100
      ).toString(),
      image: null,
    });

    setEditingId(item.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (
    id: number
  ) => {
    const confirmed = confirm(
      "Delete this item?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(
        `/api/inventory/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error(
          "Failed to delete item"
        );
      }

      await fetchItems();
    } catch (error) {
      console.error(error);
    }
  };

  const SkeletonCard = () => {
    return (
      <div className="bg-white rounded-xl shadow overflow-hidden animate-pulse">
        <div className="w-full h-48 bg-gray-200" />

        <div className="p-5">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />

          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />

          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20" />

              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>

            <div className="flex gap-2">
              <div className="h-10 w-16 bg-gray-200 rounded" />

              <div className="h-10 w-16 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 text-gray-800">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Inventory Management
        </h1>

        <div className="bg-white p-6 rounded-xl shadow mb-8 color-black">
          <h2 className="text-2xl font-semibold mb-4">
            {editingId !== null
              ? "Edit Item"
              : "Add New Item"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600"
          >
            <input
              type="text"
              placeholder="Item Name"
              required
              className="border p-3 rounded-lg"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />

            <input
              type="text"
              placeholder="Category"
              required
              className="border p-3 rounded-lg"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category:
                    e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Quantity"
              required
              min="0"
              max="2147483647"
              className="border p-3 rounded-lg"
              value={form.quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  quantity:
                    e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Price (USD)"
              required
              min="0"
              max="21474836.47"
              step="0.01"
              className="border p-3 rounded-lg"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: e.target.value,
                })
              }
            />

            <input
              type="file"
              accept="image/*"
              className="border p-3 rounded-lg md:col-span-2"
              onChange={(e) =>
                setForm({
                  ...form,
                  image:
                    e.target
                      .files?.[0] ||
                    null,
                })
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="md:col-span-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Saving..."
                : editingId !== null
                ? "Update Item"
                : "Add Item"}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fetching
            ? Array.from({
                length: 6,
              }).map((_, index) => (
                <SkeletonCard
                  key={index}
                />
              ))
            : items.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow overflow-hidden"
                >
                  {item.imageUrl && (
                    <div className="relative w-full h-48">
                      <Image
                        src={
                          item.imageUrl
                        }
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={index < 3}
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="font-bold text-xl">
                      {item.name}
                    </h3>

                    <p className="text-gray-500">
                      {item.category}
                    </p>

                    <div className="mt-3 flex justify-between items-center">
                      <div>
                        <p>
                          Qty:{" "}
                          <span className="font-semibold">
                            {
                              item.quantity
                            }
                          </span>
                        </p>

                        <p>
                          Price:{" "}
                          <span className="font-semibold">
                            $
                            {(
                              item.price /
                              100
                            ).toFixed(
                              2
                            )}
                          </span>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleEdit(
                              item
                            )
                          }
                          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(
                              item.id
                            )
                          }
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {!fetching &&
          items.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-2xl font-semibold text-gray-700">
                No inventory items found
              </h3>

              <p className="text-gray-500 mt-2">
                Add your first item to
                get started
              </p>
            </div>
          )}
      </div>
    </div>
  );
}