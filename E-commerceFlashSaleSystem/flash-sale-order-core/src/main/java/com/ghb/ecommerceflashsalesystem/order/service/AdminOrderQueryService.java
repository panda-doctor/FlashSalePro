package com.ghb.ecommerceflashsalesystem.order.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ghb.ecommerceflashsalesystem.common.api.PageResponse;
import com.ghb.ecommerceflashsalesystem.common.api.ResultCode;
import com.ghb.ecommerceflashsalesystem.common.exception.BusinessException;
import com.ghb.ecommerceflashsalesystem.domain.entity.SeckillOrder;
import com.ghb.ecommerceflashsalesystem.domain.enums.OrderStatusEnum;
import com.ghb.ecommerceflashsalesystem.order.mapper.SeckillOrderMapper;
import com.ghb.ecommerceflashsalesystem.order.vo.AdminOrderVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

/**
 * 管理端订单查询：按订单号/活动/用户/状态分页，供管理台排查使用。
 * 仅由 {@code /api/admin/**} 暴露（X-Admin-Token 双校验），不做本人归属校验。
 */
@Service
@RequiredArgsConstructor
public class AdminOrderQueryService {

    private final SeckillOrderMapper seckillOrderMapper;

    public PageResponse<AdminOrderVO> pageOrders(long page, long pageSize, String orderNo,
                                                 Long activityId, Long userId, String status) {
        LambdaQueryWrapper<SeckillOrder> query = new LambdaQueryWrapper<>();
        if (orderNo != null && !orderNo.isBlank()) {
            query.eq(SeckillOrder::getOrderNo, orderNo.trim());
        }
        if (activityId != null) {
            query.eq(SeckillOrder::getActivityId, activityId);
        }
        if (userId != null) {
            query.eq(SeckillOrder::getUserId, userId);
        }
        OrderStatusEnum statusFilter = parseStatus(status);
        if (statusFilter != null) {
            query.eq(SeckillOrder::getStatus, statusFilter.getCode());
        }
        query.orderByDesc(SeckillOrder::getCreatedAt).orderByDesc(SeckillOrder::getId);

        Page<SeckillOrder> result = seckillOrderMapper.selectPage(new Page<>(page, pageSize), query);
        List<AdminOrderVO> records = result.getRecords().stream().map(AdminOrderVO::of).toList();
        return new PageResponse<>(records, result.getCurrent(), result.getSize(),
                result.getTotal(), result.getPages());
    }

    public AdminOrderVO getOrder(String orderNo) {
        if (orderNo == null || orderNo.isBlank()) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "订单号不能为空");
        }
        SeckillOrder order = seckillOrderMapper.selectByOrderNo(orderNo.trim());
        if (order == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "订单不存在，orderNo=" + orderNo);
        }
        return AdminOrderVO.of(order);
    }

    /**
     * 接受枚举名（大小写不敏感）或 {@code ALL}；非法值按参数错误返回。
     */
    private OrderStatusEnum parseStatus(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status.trim())) {
            return null;
        }
        try {
            return OrderStatusEnum.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "无效的订单状态：" + status);
        }
    }
}
