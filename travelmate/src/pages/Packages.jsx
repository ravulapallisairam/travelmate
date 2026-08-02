import { useState, useEffect } from "react";
import PackageCard from "../components/PackageCard";
import Loader from "../components/Loader";
import api from "../api/axios";

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data } = await api.get("/packages");
        setPackages(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold">Travel Packages</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">All-inclusive packages curated for hassle-free travel</p>
      </div>
      {loading ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((p) => (
            <PackageCard key={p._id} pkg={p} />
          ))}
        </div>
      )}
    </div>
  );
}