import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Plus, Trash2, X, PencilLine, Flame } from 'lucide-react';

interface ColorVariant { name: string; image: string; price: string; }

interface Product {
  id: string; name: string; price: number; originalPrice?: number;
  description: string; imageURL: string; images?: string[];
  category: string; stock: number; variantTitle?: string;
  variants?: ColorVariant[]; trending?: boolean;
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
    category: '', stock: '', variantTitle: '', trending: false,
  });
  const [variants, setVariants] = useState<ColorVariant[]>([]);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const snap = await getDocs(collection(db, 'products'));
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addVariant = () => setVariants([...variants, { name: '', image: '', price: '' }]);
  const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));
  const updateVariant = (i: number, field: keyof ColorVariant, value: string) => {
    const u = [...variants]; u[i][field] = value; setVariants(u);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const images = [formData.imageURL, formData.image2, formData.image3, formData.image4].filter(u => u.trim());
    const data: any = {
      name: formData.name, price: parseFloat(formData.price),
      description: formData.description, imageURL: formData.imageURL,
      images, category: formData.category, stock: parseInt(formData.stock),
      trending: formData.trending,
    };
    if (formData.originalPrice) data.originalPrice = parseFloat(formData.originalPrice);
    if (formData.variantTitle && variants.length > 0) {
      data.variantTitle = formData.variantTitle;
      data.variants = variants.map(v => ({ name: v.name, image: v.image, price: v.price ? parseFloat(v.price) : parseFloat(formData.price) }));
    }
    try {
      if (editingProduct) await updateDoc(doc(db, 'products', editingProduct.id), data);
      else await addDoc(collection(db, 'products'), data);
      setShowModal(false); resetForm(); fetchProducts();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this product?')) {
      try { await deleteDoc(doc(db, 'products', id)); fetchProducts(); } catch (e) { console.error(e); }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const imgs = product.images || [];
    setFormData({
      name: product.name, price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      description: product.description, imageURL: product.imageURL || imgs[0] || '',
      image2: imgs[1] || '', image3: imgs[2] || '', image4: imgs[3] || '',
      category: product.category, stock: product.stock.toString(),
      variantTitle: product.variantTitle || '', trending: product.trending || false,
    });
    setVariants((product.variants || []).map(v => ({ name: v.name, image: v.image || '', price: v.price?.toString() || '' })));
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', originalPrice: '', description: '', imageURL: '', image2: '', image3: '', image4: '', category: '', stock: '', variantTitle: '', trending: false });
    setVariants([]); setEditingProduct(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-white text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p>Loading products...</p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">All Products <span className="text-gray-400 text-sm ml-2">({products.length})</span></h3>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center transition-colors">
          <Plus className="w-5 h-5 mr-2" /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="aspect-square bg-gray-700 flex items-center justify-center overflow-hidden relative">
              {product.imageURL ? <img src={product.imageURL} alt={product.name} className="w-full h-full object-cover" /> : <div className="text-gray-500 text-sm">No Image</div>}
              {product.trending && (
                <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3" /> Trending
                </span>
              )}
              {product.variants && product.variants.length > 0 && (
                <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">{product.variants.length} colors</span>
              )}
            </div>
            <div className="p-4">
              <h4 className="text-white font-semibold text-lg mb-1 truncate">{product.name}</h4>
              <p className="text-gray-400 text-sm mb-1">{product.category}</p>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-blue-400 font-bold text-lg">₹{Number(product.price).toLocaleString()}</p>
                {product.originalPrice && <p className="text-gray-500 text-sm line-through">₹{Number(product.originalPrice).toLocaleString()}</p>}
              </div>
              <p className="text-gray-400 text-sm mb-4">Stock: <span className={`font-medium ${product.stock === 0 ? 'text-red-400' : 'text-green-400'}`}>{product.stock}</span></p>
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

      {products.length === 0 && <div className="text-center py-12 text-gray-400">No products found. Add your first product!</div>}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <h3 className="text-xl font-semibold text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Product Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Price (₹) *</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Original Price (₹)</label>
                  <input type="number" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} className={inputClass} placeholder="For strikethrough" />
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
                    <option value="ladies-watch">Ladies Watch</option>
                    <option value="mens-watch">Mens Watch</option>
                    <option value="gadgets">Gadgets</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Description *</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className={inputClass} required />
              </div>

              {/* TRENDING TOGGLE */}
              <div className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer ${formData.trending ? 'bg-orange-900 border-orange-500' : 'bg-gray-700 border-gray-600'}`}
                onClick={() => setFormData({...formData, trending: !formData.trending})}>
                <input type="checkbox" checked={formData.trending} onChange={e => setFormData({...formData, trending: e.target.checked})}
                  className="w-5 h-5 cursor-pointer" onClick={e => e.stopPropagation()} />
                <div>
                  <p className={`font-semibold flex items-center gap-2 ${formData.trending ? 'text-orange-400' : 'text-gray-300'}`}>
                    🔥 Show in "Trending Now" on Homepage
                  </p>
                  <p className="text-gray-400 text-xs mt-1">Tick this to feature product in the trending section</p>
                </div>
              </div>

              {/* IMAGES */}
              <div className="border border-gray-600 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">🖼️ Product Images</h4>
                {['imageURL', 'image2', 'image3', 'image4'].map((field, i) => (
                  <div key={field} className="mb-3">
                    <label className={labelClass}>Image {i+1} {i === 0 ? '— Main *' : ''}</label>
                    <input type="url" value={(formData as any)[field]} onChange={e => setFormData({...formData, [field]: e.target.value})}
                      className={inputClass} placeholder="https://..." required={i === 0} />
                    {(formData as any)[field] && <img src={(formData as any)[field]} className="mt-2 h-14 w-14 object-cover rounded" onError={e => (e.currentTarget.style.display='none')} />}
                  </div>
                ))}
              </div>

              {/* VARIANTS */}
              <div className="border border-gray-600 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">🎨 Color Variants (Optional)</h4>
                <div className="mb-3">
                  <label className={labelClass}>Option Title (e.g. "Case Color")</label>
                  <input type="text" value={formData.variantTitle} onChange={e => setFormData({...formData, variantTitle: e.target.value})} className={inputClass} placeholder="e.g. Case Color" />
                </div>
                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3 relative">
                      <button type="button" onClick={() => removeVariant(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                      <div className="grid gap-2 pr-6">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Color Name *</label>
                          <input type="text" value={variant.name} onChange={e => updateVariant(index, 'name', e.target.value)} className={inputClass} placeholder="e.g. Silver, Black, Blue" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Image URL for this color</label>
                          <input type="url" value={variant.image} onChange={e => updateVariant(index, 'image', e.target.value)} className={inputClass} placeholder="https://..." />
                          {variant.image && <img src={variant.image} className="mt-2 h-12 w-12 object-cover rounded" onError={e => (e.currentTarget.style.display='none')} />}
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Price (₹)</label>
                          <input type="number" value={variant.price} onChange={e => updateVariant(index, 'price', e.target.value)} className={inputClass} placeholder={`Default: ${formData.price || '0'}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addVariant} className="mt-3 w-full border border-dashed border-gray-500 hover:border-blue-500 text-gray-400 hover:text-blue-400 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add Color Variant
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">{editingProduct ? 'Update Product' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
