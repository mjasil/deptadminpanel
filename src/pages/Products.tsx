import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Plus, Trash2, X, PencilLine } from 'lucide-react';

interface ColorVariant {
  name: string;
  image: string;
  price: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  imageURL: string;
  images?: string[];
  category: string;
  stock: number;
  variantTitle?: string;
  variants?: ColorVariant[];
}

const inputClass = "w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-300 mb-2";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '', price: '', originalPrice: '', description: '',
    imageURL: '', image2: '', image3: '', image4: '',
    category: '', stock: '', variantTitle: '',
  });

  const [variants, setVariants] = useState<ColorVariant[]>([]);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVariant = () => {
    setVariants([...variants, { name: '', image: '', price: '' }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof ColorVariant, value: string) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build images array from filled fields
    const images = [
      formData.imageURL,
      formData.image2,
      formData.image3,
      formData.image4,
    ].filter(url => url.trim() !== '');

    const productData: any = {
      name: formData.name,
      price: parseFloat(formData.price),
      description: formData.description,
      imageURL: formData.imageURL, // main image
      images: images,
      category: formData.category,
      stock: parseInt(formData.stock),
    };

    if (formData.originalPrice) {
      productData.originalPrice = parseFloat(formData.originalPrice);
    }

    if (formData.variantTitle && variants.length > 0) {
      productData.variantTitle = formData.variantTitle;
      productData.variants = variants.map(v => ({
        name: v.name,
        image: v.image,
        price: v.price ? parseFloat(v.price) : parseFloat(formData.price),
      }));
    }

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const imgs = product.images || [];
    setFormData({
      name: product.name,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      description: product.description,
      imageURL: product.imageURL || imgs[0] || '',
      image2: imgs[1] || '',
      image3: imgs[2] || '',
      image4: imgs[3] || '',
      category: product.category,
      stock: product.stock.toString(),
      variantTitle: product.variantTitle || '',
    });
    setVariants(
      (product.variants || []).map(v => ({
        name: v.name,
        image: v.image || '',
        price: v.price?.toString() || '',
      }))
    );
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '', price: '', originalPrice: '', description: '',
      imageURL: '', image2: '', image3: '', image4: '',
      category: '', stock: '', variantTitle: '',
    });
    setVariants([]);
    setEditingProduct(null);
  };

  const handleCloseModal = () => { setShowModal(false); resetForm(); };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">
          All Products <span className="text-gray-400 text-sm ml-2">({products.length})</span>
        </h3>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Product
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="aspect-square bg-gray-700 flex items-center justify-center overflow-hidden relative">
              {product.imageURL ? (
                <img src={product.imageURL} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-500 text-sm">No Image</div>
              )}
              {/* Show variant count badge */}
              {product.variants && product.variants.length > 0 && (
                <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {product.variants.length} colors
                </span>
              )}
              {/* Show image count */}
              {product.images && product.images.length > 1 && (
                <span className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                  {product.images.length} imgs
                </span>
              )}
            </div>
            <div className="p-4">
              <h4 className="text-white font-semibold text-lg mb-1 truncate">{product.name}</h4>
              <p className="text-gray-400 text-sm mb-1">{product.category}</p>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-blue-400 font-bold text-lg">₹{Number(product.price).toLocaleString()}</p>
                {product.originalPrice && (
                  <p className="text-gray-500 text-sm line-through">₹{Number(product.originalPrice).toLocaleString()}</p>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Stock: <span className={`font-medium ${product.stock === 0 ? 'text-red-400' : 'text-green-400'}`}>{product.stock}</span>
              </p>
              {/* Color variant preview */}
              {product.variants && product.variants.length > 0 && (
                <div className="flex gap-1 mb-3">
                  {product.variants.slice(0, 5).map((v, i) => (
                    <div
                      key={i}
                      title={v.name}
                      style={{ background: v.name.toLowerCase() }}
                      className="w-5 h-5 rounded-full border-2 border-gray-600"
                    />
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleEdit(product)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg flex items-center justify-center transition-colors">
                  <PencilLine className="w-4 h-4 mr-1" /> Edit
                </button>
                <button onClick={() => handleDelete(product.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg flex items-center justify-center transition-colors">
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-gray-400">No products found. Add your first product!</div>
      )}

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <h3 className="text-xl font-semibold text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Basic Info */}
              <div>
                <label className={labelClass}>Product Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Price (₹) *</label>
                  <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Original Price (₹)</label>
                  <input type="number" step="0.01" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} className={inputClass} placeholder="For strikethrough" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Stock *</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Category *</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={inputClass} required>
                    <option value="">Select category</option>
                    <option value="watch">Watch</option>
                    <option value="shoe">Shoe</option>
                    <option value="headphone">Headphone</option>
                    <option value="airpods">Airpods</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Description *</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className={inputClass} required />
              </div>

              {/* IMAGES SECTION */}
              <div className="border border-gray-600 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  🖼️ Product Images
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Image 1 — Main Image *</label>
                    <input type="url" value={formData.imageURL} onChange={e => setFormData({...formData, imageURL: e.target.value})} className={inputClass} placeholder="https://..." required />
                    {formData.imageURL && <img src={formData.imageURL} className="mt-2 h-16 w-16 object-cover rounded" onError={e => (e.currentTarget.style.display='none')} />}
                  </div>
                  <div>
                    <label className={labelClass}>Image 2</label>
                    <input type="url" value={formData.image2} onChange={e => setFormData({...formData, image2: e.target.value})} className={inputClass} placeholder="https://..." />
                    {formData.image2 && <img src={formData.image2} className="mt-2 h-16 w-16 object-cover rounded" onError={e => (e.currentTarget.style.display='none')} />}
                  </div>
                  <div>
                    <label className={labelClass}>Image 3</label>
                    <input type="url" value={formData.image3} onChange={e => setFormData({...formData, image3: e.target.value})} className={inputClass} placeholder="https://..." />
                    {formData.image3 && <img src={formData.image3} className="mt-2 h-16 w-16 object-cover rounded" onError={e => (e.currentTarget.style.display='none')} />}
                  </div>
                  <div>
                    <label className={labelClass}>Image 4</label>
                    <input type="url" value={formData.image4} onChange={e => setFormData({...formData, image4: e.target.value})} className={inputClass} placeholder="https://..." />
                    {formData.image4 && <img src={formData.image4} className="mt-2 h-16 w-16 object-cover rounded" onError={e => (e.currentTarget.style.display='none')} />}
                  </div>
                </div>
              </div>

              {/* COLOR VARIANTS SECTION */}
              <div className="border border-gray-600 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">🎨 Color Variants (Optional)</h4>
                <p className="text-gray-400 text-xs mb-3">Add colors like Silver, Black, Blue. Each color can have its own image and price.</p>

                <div className="mb-3">
                  <label className={labelClass}>Option Title (e.g. "Case Color", "Color")</label>
                  <input
                    type="text"
                    value={formData.variantTitle}
                    onChange={e => setFormData({...formData, variantTitle: e.target.value})}
                    className={inputClass}
                    placeholder="e.g. Case Color"
                  />
                </div>

                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3 relative">
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 gap-2 pr-6">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Color Name *</label>
                          <input
                            type="text"
                            value={variant.name}
                            onChange={e => updateVariant(index, 'name', e.target.value)}
                            className={inputClass}
                            placeholder="e.g. Silver, Black, Blue, Rose Gold"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Image URL for this color *</label>
                          <input
                            type="url"
                            value={variant.image}
                            onChange={e => updateVariant(index, 'image', e.target.value)}
                            className={inputClass}
                            placeholder="https://..."
                          />
                          {variant.image && (
                            <img src={variant.image} className="mt-2 h-12 w-12 object-cover rounded" onError={e => (e.currentTarget.style.display='none')} />
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Price for this color (₹)</label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={e => updateVariant(index, 'price', e.target.value)}
                            className={inputClass}
                            placeholder={`Default: ${formData.price || '0'}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addVariant}
                  className="mt-3 w-full border border-dashed border-gray-500 hover:border-blue-500 text-gray-400 hover:text-blue-400 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Color Variant
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
