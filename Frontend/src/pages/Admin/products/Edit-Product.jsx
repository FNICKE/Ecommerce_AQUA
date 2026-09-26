import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Image, X, Save, RotateCcw, AlertCircle, CheckCircle, ArrowLeft, Loader2, ImagePlus, Plus, Trash2 } from 'lucide-react';
import api from '../../../lib/api';
import { getImageUrl } from '../../../lib/imageUrl';
import MediaLibraryModal from '../../../components/MediaLibraryModal';
import { formatWeightLabel } from '../../../lib/weightFormat';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const [attributesList, setAttributesList] = useState([]);
  const [productType, setProductType] = useState('single'); // 'single' or 'variable'
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [generatedVariants, setGeneratedVariants] = useState([]);
  const [activeVariantMediaIdx, setActiveVariantMediaIdx] = useState(null);
  const [activeVariantOtherMediaIdx, setActiveVariantOtherMediaIdx] = useState(null);
  const [uploadingVariantIdx, setUploadingVariantIdx] = useState(null);

  const handleVariantLocalUpload = async (index, file) => {
    if (!file) return;
    setUploadingVariantIdx(index);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await api.post('/admin/upload-attribute-swatch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imagePath = uploadRes.data.path;
      setGeneratedVariants(prev => prev.map((gv, i) => i === index ? { ...gv, image: imagePath } : gv));
    } catch (err) {
      console.error('Variant image upload failed:', err);
    } finally {
      setUploadingVariantIdx(null);
    }
  };

  const handleVariantOtherLocalUpload = async (index, file) => {
    if (!file) return;
    setUploadingVariantIdx(index);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await api.post('/admin/upload-attribute-swatch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imagePath = uploadRes.data.path;
      setGeneratedVariants(prev => prev.map((gv, i) => {
        if (i === index) {
          const currentOther = Array.isArray(gv.other_images) ? gv.other_images : [];
          return { ...gv, other_images: [...currentOther, imagePath] };
        }
        return gv;
      }));
    } catch (err) {
      console.error('Variant other image upload failed:', err);
    } finally {
      setUploadingVariantIdx(null);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    identification: '',
    made_in: '',
    brand: '',
    tags: '',
    type: 'Physical Product',
    short_description: '',
    tax: '',
    is_prices_inclusive_tax: false,
    video_type: 'None',
    indicator: 'None',
    total_allowed_quantity: '1',
    minimum_order_quantity: '1',
    warranty_period: '',
    guarantee_period: '',
    quantity_step_size: '1',
    description: '',
    category_id: '',
    stock: '0',
    availability: '1',
    cod_allowed: '1',
    is_returnable: '0',
    is_cancelable: '0',
    price: '',
    special_price: '',
    weight: '',
    asin: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  // Each item: { url, file?, path? } — file = new upload, path = existing/media path
  const [otherImagePreviews, setOtherImagePreviews] = useState([]);
  const [selectedMediaPath, setSelectedMediaPath] = useState(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaTarget, setMediaTarget] = useState('main');

  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js';
    script.referrerPolicy = 'origin';
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('Unable to load TinyMCE text editor.');
    };
    document.body.appendChild(script);

    return () => {
      if (window.tinymce) {
        window.tinymce.remove('#description-editor');
      }
      script.remove();
    };
  }, []);

  const initTinyMCE = (initialContent) => {
    if (!window.tinymce) return;

    window.tinymce.remove('#description-editor');

    window.tinymce.init({
      selector: '#description-editor',
      height: 380,
      menubar: 'file edit view insert format tools table help',
      plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
      toolbar: 'undo redo | blocks fontfamily fontsize | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | code fullscreen preview',
      setup: (editor) => {
        editor.on('init', () => {
          editor.setContent(initialContent || '');
        });
        editor.on('change keyup', () => {
          setFormData(prev => ({ ...prev, description: editor.getContent() }));
        });
      }
    });
  };

  useEffect(() => {
    if (!initialLoading && scriptLoaded && window.tinymce) {
      initTinyMCE(formData.description);
    }
  }, [initialLoading, scriptLoaded]);

  // Load Categories, Brands & System Attributes
  useEffect(() => {
    Promise.all([
      api.get('/admin/categories').then(r => r.data?.categories || r.data?.data || (Array.isArray(r.data) ? r.data : [])),
      api.get('/admin/brands').then(r => r.data?.brands || r.data?.data || (Array.isArray(r.data) ? r.data : [])),
      api.get('/admin/attributes').then(r => r.data?.attributes || [])
    ]).then(([cats, brnds, attrs]) => {
      setCategories(cats);
      setBrands(brnds);
      setAttributesList(attrs);
    }).catch(err => {
      console.error('Failed to load initial data:', err);
    });
  }, []);

  // Fetch product data & variants to edit
  useEffect(() => {
    if (!id) return;
    setInitialLoading(true);

    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/variants/product/${id}`)
    ])
      .then(([resProd, resVars]) => {
        const prod = resProd.data?.product;
        const variants = resVars.data?.variants || [];

        if (prod) {
          setFormData({
            name: prod.name || '',
            identification: prod.identification || '',
            made_in: prod.made_in || '',
            brand: prod.brand || '',
            tags: prod.tags || '',
            type: prod.type || 'Physical Product',
            short_description: prod.short_description || '',
            tax: prod.tax || '',
            is_prices_inclusive_tax: !!prod.is_prices_inclusive_tax,
            video_type: prod.video_type || 'None',
            indicator: prod.indicator || 'None',
            total_allowed_quantity: String(prod.total_allowed_quantity || '1'),
            minimum_order_quantity: String(prod.minimum_order_quantity || '1'),
            warranty_period: prod.warranty_period || '',
            guarantee_period: prod.guarantee_period || '',
            quantity_step_size: String(prod.quantity_step_size || '1'),
            description: prod.description || '',
            category_id: String(prod.category_id || ''),
            stock: String(prod.stock || '0'),
            availability: String(prod.availability || '1'),
            cod_allowed: String(prod.cod_allowed || '1'),
            is_returnable: String(prod.is_returnable || '0'),
            is_cancelable: String(prod.is_cancelable || '0'),
            price: String(prod.price || ''),
            special_price: String(prod.special_price || ''),
            weight: prod.weight || '',
            asin: prod.asin || ''
          });

          if (prod.image) {
            setPreview(getImageUrl(prod.image));
            setSelectedMediaPath(prod.image);
          }

          // Load existing other_images from DB
          const otherImgs = Array.isArray(prod.other_images) ? prod.other_images : [];
          if (otherImgs.length > 0) {
            setOtherImagePreviews(otherImgs.map(p => ({
              url: getImageUrl(p),
              path: p,
              file: null
            })));
          }

          // Load variants if they exist and are dynamic (have attribute_value_ids)
          const activeVars = variants.filter(v => v.attribute_value_ids);
          if (activeVars.length > 0) {
            setProductType('variable');

            // Reconstruct selectedAttributes
            const attrMap = {};
            activeVars.forEach(v => {
              if (v.attribute_values) {
                v.attribute_values.forEach(av => {
                  if (!attrMap[av.attribute_id]) {
                    attrMap[av.attribute_id] = new Set();
                  }
                  attrMap[av.attribute_id].add(av.value_id);
                });
              }
            });

            const selAttrs = Object.keys(attrMap).map(attrId => ({
              attributeId: parseInt(attrId, 10),
              selectedValueIds: Array.from(attrMap[attrId])
            }));
            setSelectedAttributes(selAttrs);

            // Populate generatedVariants
            setGeneratedVariants(activeVars.map(v => {
              let parsedOther = [];
              if (typeof v.other_images === 'string') {
                try {
                  parsedOther = JSON.parse(v.other_images);
                } catch (e) {
                  parsedOther = [];
                }
              } else if (Array.isArray(v.other_images)) {
                parsedOther = v.other_images;
              }
              return {
                id: v.id,
                attribute_value_ids: v.attribute_value_ids,
                name: v.attribute_values && v.attribute_values.length > 0 
                  ? v.attribute_values.map(av => av.value_name).join(' / ') 
                  : v.weight || 'Default',
                price: String(v.price || ''),
                special_price: String(v.special_price || ''),
                stock: String(v.stock || '0'),
                sku: v.sku || '',
                weight: v.weight || '',
                image: v.image || '',
                other_images: parsedOther
              };
            }));
          }
        } else {
          setStatus({ type: 'error', message: 'Product could not be loaded.' });
        }
      })
      .catch(err => {
        console.error('Failed to load product details:', err);
        setStatus({ type: 'error', message: 'Failed to load product details. It may not exist or has been deleted.' });
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, [id]);

  const handleAddAttribute = (attrId) => {
    if (!attrId) return;
    const idNum = parseInt(attrId, 10);
    if (selectedAttributes.some(a => a.attributeId === idNum)) return;
    setSelectedAttributes(prev => [...prev, { attributeId: idNum, selectedValueIds: [] }]);
  };

  const handleRemoveAttribute = (attrId) => {
    setSelectedAttributes(prev => prev.filter(a => a.attributeId !== attrId));
  };

  const handleToggleValue = (attrId, valId) => {
    setSelectedAttributes(prev => prev.map(a => {
      if (a.attributeId !== attrId) return a;
      const isSelected = a.selectedValueIds.includes(valId);
      const newValues = isSelected 
        ? a.selectedValueIds.filter(val => val !== valId)
        : [...a.selectedValueIds, valId];
      return { ...a, selectedValueIds: newValues };
    }));
  };

  const generateCartesianCombinations = () => {
    const activeAttrs = selectedAttributes.filter(a => a.selectedValueIds.length > 0);
    if (activeAttrs.length === 0) {
      setGeneratedVariants([]);
      return;
    }

    const cartesian = (arrays) => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap(d => curr.map(e => [...d, e]));
      }, [[]]);
    };

    const arraysOfValues = activeAttrs.map(attrSel => {
      const fullAttr = attributesList.find(a => a.id === attrSel.attributeId);
      return attrSel.selectedValueIds.map(valId => {
        const fullVal = fullAttr?.values?.find(v => v.id === valId);
        return {
          attributeId: attrSel.attributeId,
          attributeName: fullAttr?.name || '',
          valueId: valId,
          valueName: fullVal?.value || ''
        };
      });
    });

    const combinations = cartesian(arraysOfValues);

    const newVariants = combinations.map(combo => {
      const valIds = combo.map(c => c.valueId).sort((a, b) => a - b).join(',');
      const name = combo.map(c => c.valueName).join(' / ');

      const existing = generatedVariants.find(gv => gv.attribute_value_ids === valIds);
      return {
        id: existing ? existing.id : null,
        attribute_value_ids: valIds,
        name: name,
        price: existing ? existing.price : formData.price || '',
        special_price: existing ? existing.special_price : formData.special_price || '',
        stock: existing ? existing.stock : formData.stock || '0',
        sku: existing ? existing.sku : '',
        weight: existing ? existing.weight : formData.weight || '',
        image: existing ? existing.image : '',
        other_images: existing ? (existing.other_images || []) : []
      };
    });

    setGeneratedVariants(newVariants);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setSelectedMediaPath(null);
    }
  };

  const handleMainImageDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type?.startsWith('image/')) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setSelectedMediaPath(null);
    }
  };

  const handleOtherImagesChange = (files) => {
    const imageFiles = Array.from(files || []).filter(file => file.type.startsWith('image/'));
    if (!imageFiles.length) return;
    setOtherImagePreviews(prev => [
      ...prev,
      ...imageFiles.map(file => ({
        url: URL.createObjectURL(file),
        file,   // new upload — sent as other_images_files[]
        path: null
      })),
    ]);
  };

  const handleMediaSelect = (item) => {
    const isExternal = item.path && (item.path.startsWith('http://') || item.path.startsWith('https://'));
    const cleanPath = item.path
      ? (isExternal ? item.path : (item.path.startsWith('/') ? item.path : `/${item.path}`))
      : null;

    if (activeVariantMediaIdx !== null && activeVariantMediaIdx !== undefined) {
      setGeneratedVariants(prev => prev.map((gv, i) => i === activeVariantMediaIdx ? { ...gv, image: cleanPath } : gv));
      setActiveVariantMediaIdx(null);
      setShowMediaModal(false);
      return;
    }

    if (activeVariantOtherMediaIdx !== null && activeVariantOtherMediaIdx !== undefined) {
      setGeneratedVariants(prev => prev.map((gv, i) => {
        if (i === activeVariantOtherMediaIdx) {
          const currentOther = Array.isArray(gv.other_images) ? gv.other_images : [];
          return { ...gv, other_images: [...currentOther, cleanPath] };
        }
        return gv;
      }));
      setActiveVariantOtherMediaIdx(null);
      setShowMediaModal(false);
      return;
    }

    if (mediaTarget === 'other') {
      setOtherImagePreviews(prev => [
        ...prev,
        {
          url: item.url,
          path: cleanPath, // media library path — sent as media_other_images[]
          file: null
        },
      ]);
      return;
    }

    setSelectedMediaPath(cleanPath);
    setPreview(item.url);
    setImageFile(null);
  };

  const removeImage = () => {
    setImageFile(null);
    setPreview(null);
    setSelectedMediaPath(null);
  };

  const removeOtherImage = (index) => {
    setOtherImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const data = new FormData();
      const descriptionContent = window.tinymce ? window.tinymce.get('description-editor')?.getContent() : formData.description;

      // Append all text fields
      Object.entries(formData).forEach(([key, value]) => {
        const val = key === 'description' ? descriptionContent : value;
        data.append(key, key === 'weight' ? formatWeightLabel(val) : val);
      });

      // ── Main image ────────────────────────────────────────────────────
      if (imageFile) {
        data.append('image', imageFile);
      } else if (selectedMediaPath) {
        data.append('imagePath', selectedMediaPath);
      }

      if (productType === 'variable') {
        data.append('variants', JSON.stringify(generatedVariants));
      }

      // ── Other images ──────────────────────────────────────────────────
      // 1. Existing DB paths (keep them)
      const existingPaths = otherImagePreviews
        .filter(img => img.path && !img.file)
        .map(img => img.path);
      data.append('existing_other_images', JSON.stringify(existingPaths));

      // 2. New uploaded files
      otherImagePreviews
        .filter(img => img.file)
        .forEach(img => data.append('other_images_files', img.file));

      const response = await api.put(`/products/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setStatus({ type: 'success', message: 'Product updated successfully!' });
        setTimeout(() => {
          navigate('/admin/manage-products');
        }, 1500);
      }
    } catch (error) {
      console.error('Update product error:', error);
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update product. Check server logs.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading product data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/manage-products')}
            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-gray-700"
            title="Back to products list"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-[#4e5e7a]">Edit Product</h2>
        </div>
        <p className="text-sm text-gray-500">
          Home / Manage Products / <span className="text-purple-600">Edit Product</span>
        </p>
      </div>

      {status.message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border ${
          status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {status.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
          <span>{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-[#4e5e7a]">Product Information</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Product Name"
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                    Identification of Product
                  </label>
                  <input
                    type="text"
                    name="identification"
                    value={formData.identification}
                    onChange={handleChange}
                    placeholder="Product Identification Number"
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                    Made In
                  </label>
                  <select
                    name="made_in"
                    value={formData.made_in}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 appearance-none bg-white"
                  >
                    <option value="">Search for countries</option>
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                    Brand
                  </label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 appearance-none bg-white"
                  >
                    <option value="">Select brand</option>
                    {brands.filter(b => b.status !== 0).map(brand => (
                      <option key={brand.id} value={brand.name}>{brand.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="Enter product tags"
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                    ASIN (Amazon Identification Number)
                  </label>
                  <input
                    type="text"
                    name="asin"
                    value={formData.asin}
                    onChange={handleChange}
                    placeholder="e.g. B08N5WRWNW"
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                    Short Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleChange}
                    required
                    rows="3"
                    placeholder="Product Short Description"
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4">
            {/* Category display */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full">
              <div className="p-4 border-b bg-gray-50/50">
                <h3 className="font-bold text-[#4e5e7a]">Selected Category</h3>
              </div>
              <div className="p-6">
                {formData.category_id ? (
                  <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <span className="text-purple-600">📂</span>
                    <span className="text-sm font-medium text-purple-700">
                      {categories.find(c => String(c.id) === String(formData.category_id))?.name || 'Selected'}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No category selected yet. Choose one from the Category dropdown above.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Type & Pricing/Variant Builder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-bold text-[#4e5e7a]">Product Type & Pricing</h3>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setProductType('single')}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
                      productType === 'single'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Single Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductType('variable')}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
                      productType === 'variable'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Variable Product
                  </button>
                </div>
              </div>

              {productType === 'single' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                      Original Price (MRP) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required={productType === 'single'}
                      min="0"
                      placeholder="e.g. 1500"
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                      Special Price (Discounted)
                    </label>
                    <input
                      type="number"
                      name="special_price"
                      value={formData.special_price}
                      onChange={handleChange}
                      min="0"
                      placeholder="e.g. 1200"
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Select System Attribute */}
                  <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-purple-900">Configure Attributes</h4>
                      <p className="text-xs text-purple-700">Choose attributes (e.g. Color, Size) and select values to generate combinations.</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <select
                        onChange={(e) => {
                          handleAddAttribute(e.target.value);
                          e.target.value = "";
                        }}
                        className="flex-1 md:w-56 border border-purple-200 rounded-lg p-2 text-xs outline-none bg-white font-medium text-purple-900"
                      >
                        <option value="">-- Add System Attribute --</option>
                        {attributesList
                          .filter(a => !selectedAttributes.some(sa => sa.attributeId === a.id))
                          .map(attr => (
                            <option key={attr.id} value={attr.id}>{attr.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  {/* Attributes Configuration List */}
                  {selectedAttributes.length > 0 ? (
                    <div className="space-y-4">
                      {selectedAttributes.map(selAttr => {
                        const attr = attributesList.find(a => a.id === selAttr.attributeId);
                        if (!attr) return null;
                        return (
                          <div key={selAttr.attributeId} className="border border-slate-100 rounded-xl p-4 space-y-3 bg-white shadow-sm relative group">
                            <button
                              type="button"
                              onClick={() => handleRemoveAttribute(selAttr.attributeId)}
                              className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors p-1"
                              title="Remove Attribute"
                            >
                              <Trash2 size={16} />
                            </button>
                            <h5 className="font-bold text-sm text-[#4e5e7a]">{attr.name}</h5>
                            <div className="flex flex-wrap gap-2">
                              {attr.values && attr.values.map(val => {
                                const isChecked = selAttr.selectedValueIds.includes(val.id);
                                return (
                                  <button
                                    type="button"
                                    key={val.id}
                                    onClick={() => handleToggleValue(selAttr.attributeId, val.id)}
                                    className={`px-3 py-1 text-xs rounded-full border font-medium transition cursor-pointer ${
                                      isChecked
                                        ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    {val.value}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Generate Action */}
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={generateCartesianCombinations}
                          className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                        >
                          <Plus size={14} /> Generate Combinations
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <p className="text-sm text-slate-400">No attributes added yet. Add an attribute from the selector above to start.</p>
                    </div>
                  )}

                  {/* Spreadsheet Grid */}
                  {generatedVariants.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-[#4e5e7a]">Combinations Spreadsheet</h4>
                        <span className="bg-purple-100 text-purple-700 font-bold px-2.5 py-0.5 rounded-full text-xs">
                          {generatedVariants.length} Combinations
                        </span>
                      </div>
                      <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto max-w-full">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50/70 border-b border-slate-100 text-[#4e5e7a] font-bold">
                                <th className="p-3 min-w-[150px]">Variant Combination</th>
                                <th className="p-3 min-w-[130px]">MRP Price (₹)</th>
                                <th className="p-3 min-w-[130px]">Special Price (₹)</th>
                                <th className="p-3 min-w-[110px]">Main Image</th>
                                <th className="p-3 min-w-[170px]">Other Images</th>
                                <th className="p-3 min-w-[90px]">Stock</th>
                                <th className="p-3 min-w-[140px]">SKU</th>
                                <th className="p-3 min-w-[110px]">Weight</th>
                                <th className="p-3 min-w-[70px] text-center">Delete</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {generatedVariants.map((v, index) => (
                                <tr key={v.attribute_value_ids} className="hover:bg-slate-50/40 transition">
                                  <td className="p-3 font-semibold text-slate-700">{v.name}</td>
                                  <td className="p-3">
                                    <input
                                      type="number"
                                      value={v.price}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setGeneratedVariants(prev => prev.map((gv, i) => i === index ? { ...gv, price: val } : gv));
                                      }}
                                      required
                                      min="0"
                                      className="w-full border border-slate-200 rounded p-1 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="number"
                                      value={v.special_price}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setGeneratedVariants(prev => prev.map((gv, i) => i === index ? { ...gv, special_price: val } : gv));
                                      }}
                                      min="0"
                                      className="w-full border border-slate-200 rounded p-1 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden flex items-center justify-center bg-white shrink-0 relative">
                                        {v.image ? (
                                          <img src={getImageUrl(v.image)} alt="" className="w-full h-full object-contain" />
                                        ) : (
                                          <span className="text-[7px] text-gray-400 font-bold uppercase">No Img</span>
                                        )}
                                        {uploadingVariantIdx === index && (
                                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <Loader2 size={10} className="text-white animate-spin" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <button
                                          type="button"
                                          onClick={() => { setActiveVariantMediaIdx(index); setShowMediaModal(true); }}
                                          className="p-1 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded transition-colors text-center"
                                          title="Select from Media Gallery"
                                        >
                                          <Image size={10} />
                                        </button>
                                        <label className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded cursor-pointer transition-colors text-center shadow-sm" title="Upload Local File">
                                          <Upload size={10} className="mx-auto" />
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => handleVariantLocalUpload(index, e.target.files?.[0])}
                                            disabled={uploadingVariantIdx === index}
                                            className="hidden"
                                          />
                                        </label>
                                        {v.image && (
                                          <button
                                            type="button"
                                            onClick={() => setGeneratedVariants(prev => prev.map((gv, i) => i === index ? { ...gv, image: '' } : gv))}
                                            className="p-0.5 bg-red-50 hover:bg-red-100 text-red-500 rounded transition-colors text-center"
                                            title="Remove Image"
                                          >
                                            <X size={10} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                                        {Array.isArray(v.other_images) && v.other_images.map((img, oIdx) => (
                                          <div key={oIdx} className="w-8 h-8 rounded border border-slate-200 overflow-hidden flex items-center justify-center bg-white relative group shrink-0">
                                            <img src={getImageUrl(img)} alt="" className="w-full h-full object-contain" />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setGeneratedVariants(prev => prev.map((gv, i) => i === index 
                                                  ? { ...gv, other_images: gv.other_images.filter((_, oi) => oi !== oIdx) }
                                                  : gv
                                                ));
                                              }}
                                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                                              title="Remove"
                                            >
                                              <X size={10} />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="flex gap-1">
                                        <button
                                          type="button"
                                          onClick={() => { setActiveVariantOtherMediaIdx(index); setShowMediaModal(true); }}
                                          className="p-1 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded transition-colors text-center text-[9px] flex items-center gap-0.5 cursor-pointer font-semibold"
                                          title="Add from Media Gallery"
                                        >
                                          <ImagePlus size={10} /> Add
                                        </button>
                                        <label className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded cursor-pointer transition-colors text-center text-[9px] flex items-center gap-0.5 shadow-sm font-semibold" title="Upload Local File">
                                          <Upload size={10} /> Upload
                                          <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={e => {
                                              const files = Array.from(e.target.files || []);
                                              files.forEach(file => handleVariantOtherLocalUpload(index, file));
                                            }}
                                            className="hidden"
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="number"
                                      value={v.stock}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setGeneratedVariants(prev => prev.map((gv, i) => i === index ? { ...gv, stock: val } : gv));
                                      }}
                                      required
                                      min="0"
                                      className="w-full border border-slate-200 rounded p-1 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      value={v.sku}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setGeneratedVariants(prev => prev.map((gv, i) => i === index ? { ...gv, sku: val } : gv));
                                      }}
                                      placeholder="e.g. SKU-123"
                                      className="w-full border border-slate-200 rounded p-1 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      value={v.weight}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setGeneratedVariants(prev => prev.map((gv, i) => i === index ? { ...gv, weight: val } : gv));
                                      }}
                                      placeholder="e.g. 1kg"
                                      className="w-full border border-slate-200 rounded p-1 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setGeneratedVariants(prev => prev.filter((_, i) => i !== index))}
                                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                                      title="Remove this combination"
                                    >
                                      <X size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tax & Video */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-[#4e5e7a] mb-4 border-b pb-2">Product Tax</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="tax"
                    value={formData.tax}
                    onChange={handleChange}
                    placeholder="e.g. 5% GST"
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Tax Included in prices?</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_prices_inclusive_tax"
                        checked={formData.is_prices_inclusive_tax}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hidden">
                <h3 className="font-bold text-[#4e5e7a] mb-4 border-b pb-2">Product Video Type</h3>
                <select
                  name="video_type"
                  value={formData.video_type}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 appearance-none bg-white"
                >
                  <option value="None">None</option>
                  <option value="Youtube">Youtube</option>
                  <option value="Vimeo">Vimeo</option>
                  <option value="Self Hosted">Self Hosted</option>
                </select>
              </div>
            </div>

        {/* Product Images */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50">
            <h3 className="font-bold text-[#4e5e7a]">Product Images</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#4e5e7a] mb-3">Main Image</label>
              {preview ? (
                <div className="relative border border-slate-100 rounded-xl bg-slate-50/50 p-6 flex items-center justify-center min-h-[180px] w-full animate-in fade-in duration-300">
                  <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-center">
                    <img
                      src={preview}
                      alt="Main product preview"
                      className="max-w-full max-h-full object-contain rounded-lg"
                      onError={(e) => { e.target.src = 'https://placehold.co/180x180?text=No+Image'; }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-md transition-all hover:scale-105 active:scale-95"
                    title="Remove main image"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleMainImageDrop}
                  className="flex h-36 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-white text-center transition-all hover:border-purple-400 hover:bg-purple-50/30"
                >
                  <ImagePlus size={44} className="mb-2 text-[#94a3b8]" />
                  <span className="text-sm font-semibold text-[#475569]">
                    Drop your image here, or <button type="button" onClick={() => { setMediaTarget('main'); setShowMediaModal(true); }} className="text-purple-600 hover:underline font-bold">browse</button>
                  </span>
                  <span className="text-xs text-slate-400 mt-1">Recommended Size : 180 x 180 pixels</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#4e5e7a] mb-3">Other Images</label>
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleOtherImagesChange(e.dataTransfer.files);
                }}
                className="flex h-36 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-white text-center transition-all hover:border-purple-400 hover:bg-purple-50/30"
              >
                <ImagePlus size={44} className="mb-2 text-[#94a3b8]" />
                <span className="text-sm font-semibold text-[#475569]">
                  Drop your image here, or <button type="button" onClick={(e) => { e.preventDefault(); setMediaTarget('other'); setShowMediaModal(true); }} className="text-purple-600 hover:underline font-bold">browse</button>
                </span>
                <span className="text-xs text-slate-400 mt-1">Recommended Size : 180 x 180 pixels</span>
                <input type="file" accept="image/*" multiple onChange={e => handleOtherImagesChange(e.target.files)} className="hidden" />
              </label>

              {otherImagePreviews.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-4">
                  {otherImagePreviews.map((img, index) => (
                    <div key={`${img.path || img.url || img.name || index}-${index}`} className="relative rounded-xl border border-slate-100 p-2 bg-white flex items-center justify-center w-32 h-32 md:w-36 md:h-36 shrink-0 shadow-sm animate-in fade-in duration-300">
                      <img 
                        src={img.url} 
                        alt={img.name || `other-${index}`} 
                        className="max-w-full max-h-full object-contain rounded-lg" 
                        onError={(e) => { e.target.src = 'https://placehold.co/180x180?text=No+Image'; }}
                      />
                      <button
                        type="button"
                        onClick={() => removeOtherImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 text-white shadow-md z-10 transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quantity & Other */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-[#4e5e7a] mb-6 border-b pb-2">Quantity & Other Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                Total Allowed Quantity
              </label>
              <input
                type="number"
                name="total_allowed_quantity"
                value={formData.total_allowed_quantity}
                onChange={handleChange}
                min="1"
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                Minimum Order Quantity
              </label>
              <input
                type="number"
                name="minimum_order_quantity"
                value={formData.minimum_order_quantity}
                onChange={handleChange}
                min="1"
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                Quantity Step Size
              </label>
              <input
                type="number"
                name="quantity_step_size"
                value={formData.quantity_step_size}
                onChange={handleChange}
                min="1"
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                Availability
              </label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 appearance-none bg-white"
              >
                <option value="1">Available</option>
                <option value="0">Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                Indicator
              </label>
              <select
                name="indicator"
                value={formData.indicator}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 appearance-none bg-white"
              >
                <option value="None">None</option>
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                Warranty Period
              </label>
              <input
                type="text"
                name="warranty_period"
                value={formData.warranty_period}
                onChange={handleChange}
                placeholder="e.g. 6 months"
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                Guarantee Period
              </label>
              <input
                type="text"
                name="guarantee_period"
                value={formData.guarantee_period}
                onChange={handleChange}
                placeholder="e.g. 1 year"
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50">
            <h3 className="font-bold text-[#4e5e7a]">Full Description</h3>
          </div>
          <div className="p-6">
            <textarea
              id="description-editor"
              defaultValue={formData.description}
              rows="10"
              placeholder="Detailed product description, ingredients, usage..."
              className="w-full border border-gray-200 rounded-lg p-4 text-sm outline-none focus:ring-1 focus:ring-purple-500 resize-y min-h-[200px]"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={() => navigate('/admin/manage-products')}
            className="px-8 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium shadow-sm transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className={`px-8 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 min-w-[160px] justify-center ${
              loading ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {loading ? 'Saving Changes...' : (<><Save size={18} /> Save Changes</>)}
          </button>
        </div>
      </form>

      <MediaLibraryModal
        open={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
