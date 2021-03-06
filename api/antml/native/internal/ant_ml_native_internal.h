/* Copyright (c) 2017-2020 SKKU ESLAB, and contributors. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifndef __ANT_ML_NATIVE_INTERNAL_H__
#define __ANT_ML_NATIVE_INTERNAL_H__

#include <sys/types.h>

void ant_ml_getMaxOfBuffer_internal_uint8(const unsigned char *data_array,
                                          size_t data_array_len,
                                          int *result_max_index,
                                          unsigned char *result_value);
void ant_ml_getMaxOfBuffer_internal_int32(const int32_t *data_array,
                                          size_t data_array_len,
                                          int *result_max_index,
                                          int32_t *result_value);
void ant_ml_getMaxOfBuffer_internal_float32(const float *data_array,
                                            size_t data_array_len,
                                            int *result_max_index,
                                            float *result_value);

void initANTML(void);

#endif /* !defined(__ANT_ML_NATIVE_INTERNAL_H__) */
