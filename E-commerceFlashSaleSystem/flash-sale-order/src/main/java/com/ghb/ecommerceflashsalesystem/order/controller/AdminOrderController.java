package com.ghb.ecommerceflashsalesystem.order.controller;

import com.ghb.ecommerceflashsalesystem.common.api.PageResponse;
import com.ghb.ecommerceflashsalesystem.common.api.Result;
import com.ghb.ecommerceflashsalesystem.order.service.AdminOrderQueryService;
import com.ghb.ecommerceflashsalesystem.order.vo.AdminOrderVO;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理端订单控制器：仅经 {@code /api/admin/**} 暴露，由网关 + AdminAccessWebConfig
 * 双重校验 {@code X-Admin-Token}（无需会话/CSRF）。
 */
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final AdminOrderQueryService adminOrderQueryService;

    /**
     * 订单分页：订单号精确匹配，活动/用户/状态为可选过滤。
     */
    @GetMapping
    public Result<PageResponse<AdminOrderVO>> pageOrders(
            @RequestParam(defaultValue = "1") @Min(1) long page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) long pageSize,
            @RequestParam(required = false) String orderNo,
            @RequestParam(required = false) Long activityId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String status) {
        return Result.success(adminOrderQueryService.pageOrders(page, pageSize, orderNo, activityId, userId, status));
    }

    /** 订单详情（管理端视角，不做本人归属校验）。 */
    @GetMapping("/{orderNo}")
    public Result<AdminOrderVO> getOrder(@PathVariable String orderNo) {
        return Result.success(adminOrderQueryService.getOrder(orderNo));
    }
}
